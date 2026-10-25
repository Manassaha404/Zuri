import {
  ConditionalEdgeRouter,
  GraphNode,
  LangGraphRunnableConfig,
} from "@langchain/langgraph";
import { Document } from "@langchain/core/documents";
import { AIMessage } from "@langchain/core/messages";
import { MessagesState, RagState } from "./state";
import { SystemPromptForMessageLLM, RagFinalResponsePrompt } from "./prompt";
import {
  model,
  extractor,
  evaluatorLLMSchema,
  tvly,
  refineLLMSchema,
} from "./model";
import { lastOfType, textOf, trimmer } from "./utils";
import { vectorStore } from "./vectorStore";
import { ragAgent } from "./graph";

export const llmCall: GraphNode<typeof MessagesState> = async (
  state,
  config: LangGraphRunnableConfig,
) => {
  const userId = config.configurable?.user_id ?? "anonymous";
  const trimmed = await trimmer.invoke(state.messages);
  const lastHuman = lastOfType(state.messages, "human");
  // symmetric search in long term memory store
  const namespace = ["memories", userId];
  const hits = lastHuman
    ? await config.store?.search(namespace, {
        query: textOf(lastHuman.content),
        limit: 3,
      })
    : [];
  const promptValue = await SystemPromptForMessageLLM.invoke({
    date: new Date().toISOString().slice(0, 10),
    summary: state.summery || "No summary yet.",
    memories: hits?.length
      ? hits.map((h) => `- ${h.value.text}`).join("\n")
      : "No relevant memories.",
    messages: trimmed,
  });
  const response = await model.invoke(promptValue);
  return { messages: [response] };
};

// summery generate node for short term memory
export const generateSummery: GraphNode<typeof MessagesState> = async (
  state,
) => {
  // extract latest ai and human sms
  // skip empty ai sms (tool call turns have no text)
  const msgs = [...state.messages].reverse();
  const lastAi = msgs.find((m) => m.type === "ai" && textOf(m.content).trim());
  const lastHuman = msgs.find((m) => m.type === "human");

  if (!lastHuman || !lastAi) return {};

  //prompt for generate summery of conversation, (lastAi + lastHuman + previousSummery) = latest summery
  const summaryPrompt = `You maintain a running summary of a conversation.

Previous summary:
${state.summery || "(none yet)"}

New exchange:
User: ${textOf(lastHuman.content)}
Assistant: ${textOf(lastAi.content)}

Write an updated summary that merges the new exchange into the previous summary.
Keep durable facts (names, preferences, decisions, open questions). Drop small talk.
Stay under 150 words. Return only the summary text.`;

  //grab the response and store it on state summery
  const response = await model.invoke(summaryPrompt);
  return { summery: textOf(response.content) };
};

// title generate node for the conversation
export const generateTitle: GraphNode<typeof MessagesState> = async (state) => {
  const msgs = [...state.messages].reverse();
  const lastHuman = msgs.find((m) => m.type === "human");

  if (!lastHuman) return {};

  const previousTitle = state.title || "new-chat";
  const conversationSummary = state.summery || "(no summary yet)";
  const latestHumanMessage = textOf(lastHuman.content);

  const titlePrompt = `You generate a short, descriptive title for a conversation between a user and an AI assistant.

Previous title:
${previousTitle}

Conversation summary:
${conversationSummary}

Latest user message:
${latestHumanMessage}

Instructions:
- Create a concise, relevant title (3 to 6 words) summarizing the main topic or intent.
- If the previous title is already descriptive and still fits the conversation, you can keep or lightly refine it.
- If the previous title is "new-chat" or generic, create a fresh, accurate title.
- Do NOT use quotation marks, markdown, or ending punctuation.
- Return ONLY the title text.`;

  const response = await model.invoke(titlePrompt);
  const title = textOf(response.content)
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();

  return { title: title || previousTitle };
};

export const generateLongTermMemory: GraphNode<typeof MessagesState> = async (
  state,
  config: LangGraphRunnableConfig,
) => {
  const memStore = config.store;
  if (!memStore) return {};

  const msgs = [...state.messages].reverse();
  const lastAi = msgs.find((m) => m.type === "ai" && textOf(m.content).trim());
  const lastHuman = msgs.find((m) => m.type === "human");
  if (!lastHuman) return {};

  const userId = config.configurable?.user_id ?? "anonymous";
  const userNamespace = ["memories", userId];

  const existing = await memStore.search(userNamespace, {
    query: textOf(lastHuman.content),
    limit: 10, // A bit higher so contradicting facts are more likely to show up
  });

  // Use small integer refs instead of UUIDs so the LLM references existing memories reliably
  const existingList = existing.length
    ? existing
        .map(
          (h, i) =>
            `[${i}] [${h.value?.type ?? h.namespace?.[2] ?? "semantic"}] ${h.value?.text ?? ""}`,
        )
        .join("\n")
    : "(none)";

  const result =
    await extractor.invoke(`You maintain long-term memories about a user categorized into human cognitive psychology branches adapted for AI agents.

Memory Taxonomy:
1. "profile": Core biographical & identity facts about the user (e.g. name, address, father's/mother's name, age, contact information, background facts).
2. Explicit (declarative) memory:
   - "episodic": Past interactions, personal events, and experiences (e.g. "last week we debugged X", personal milestones, past sessions).
   - "semantic": General facts, concepts, and preferences about the user or the world (e.g. "prefers TypeScript", "Berlin is the capital of Germany").
3. Implicit (non-declarative) memory:
   - "procedural": How to do things: rules, workflows, learned behaviors, habits, coding instructions, and guidelines (e.g. "always format code without any", "answer in concise bullet points").

Existing memories:
${existingList}

New exchange:
User: ${textOf(lastHuman.content)}
Assistant: ${textOf(lastAi?.content)}

Rules:
- For every "add" or "update", assign the appropriate type: "profile", "episodic", "semantic", or "procedural".
- Only use durable facts, rules, or events stated by the USER.
- If the user states something that CONTRADICTS or CHANGES an existing memory, use "update" with that memory's reference number, the full updated text, and type.
- If the user says an existing memory is no longer true and there is no replacement, use "delete" with that memory's reference number.
- Use "add" only for genuinely new memories not covered by any existing memory.
- Do NOT save small talk, one-off questions, or things only the assistant said.
- Never save secrets, passwords, or sensitive credentials.
- If nothing qualifies, return an empty list.`);

  await Promise.all(
    result.operations.map(async (op) => {
      const memoryType = op.type ?? "semantic";
      const targetNamespace = ["memories", userId, memoryType];

      if (op.action === "add") {
        if (!op.text) return; // Skip if text is missing
        return memStore.put(targetNamespace, crypto.randomUUID(), {
          text: op.text,
          type: memoryType,
        });
      }
      if (typeof op.ref !== "number") return; // Update/delete require a valid ref
      const target = existing[op.ref];
      if (!target) return; // Ignore out-of-range refs
      if (op.action === "update") {
        if (!op.text) return; // Skip if text is missing
        const nextType =
          op.type ??
          target.value?.type ??
          (target.namespace?.[2] as string) ??
          "semantic";
        const newNamespace = ["memories", userId, nextType];
        if (
          target.namespace &&
          target.namespace.join("/") !== newNamespace.join("/")
        ) {
          await memStore.delete(target.namespace, target.key);
        }
        return memStore.put(newNamespace, target.key, {
          text: op.text,
          type: nextType,
        });
      }
      return memStore.delete(target.namespace ?? userNamespace, target.key);
    }),
  );

  if (result.operations.length) {
    console.log("[memory] ops:", result.operations);
  }
  return {};
};

export const isRagRequiredOrNot: ConditionalEdgeRouter<{
  InputSchema: typeof MessagesState;
  nodes: "llm_call" | "rag_node";
}> = (state) => {
  if (state.isFilesInclude) {
    return "rag_node";
  } else {
    return "llm_call";
  }
};

// Query ragAgent with latest human message, synthesize final response with model, and store it as AIMessage
export const ragNode: GraphNode<typeof MessagesState> = async (
  state,
  config: LangGraphRunnableConfig,
) => {
  const userId = config.configurable?.user_id ?? "anonymous";
  const conversationId = config.configurable?.thread_id ?? null;
  const lastHuman = lastOfType(state.messages, "human");
  const query = lastHuman ? textOf(lastHuman.content) : "";

  // Call RAG agent to retrieve context and generate initial findings
  const result = await ragAgent.invoke({ query, conversationId });
  const ragAnswer =
    result?.answer || "No relevant information found in the documents.";

  // Fetch long-term memories for personalization
  const namespace = ["memories", userId];
  const hits = lastHuman
    ? await config.store?.search(namespace, {
        query,
        limit: 3,
      })
    : [];

  const trimmed = await trimmer.invoke(state.messages);

  // Format final prompt with main query, RAG answer, summary, and memories
  const promptValue = await RagFinalResponsePrompt.invoke({
    date: new Date().toISOString().slice(0, 10),
    ragAnswer,
    summary: state.summery || "No summary yet.",
    memories: hits?.length
      ? hits.map((h) => `- ${h.value.text}`).join("\n")
      : "No relevant memories.",
    messages: trimmed,
  });

  // Generate final result using main model
  const response = await model.invoke(promptValue);

  return {
    messages: [response],
  };
};

// rag graph nodes
export const stepBackQuery: GraphNode<typeof RagState> = async (state) => {
  const prompt = `You are a query refinement engine. Rewrite the user's message into one improved search query for vector search and web search. Do NOT answer the question.

Current date: {{${new Date().toISOString().split("T")[0]}}}
User query: {{${state.query}}}

Rules:
- Fix typos and expand abbreviations (e.g. "k8s" -> "Kubernetes").
- Add relevant keywords, synonyms, and technical terms that improve retrieval.
- Include the year or version only if the query depends on recent information.
- Keep the user's original intent. Never invent facts, names, or versions.
- If the message is chitchat (e.g. "thanks"), return it unchanged.

Output ONLY the refined query as plain text. No JSON, no quotes, no explanation.

Examples:
Input: how do i make postgres graph faster
Output: how to improve performance of PostgreSQL graph queries Apache AGE indexing optimization large datasets

Input: latest react version features
Output: React latest version new features release notes 2026

Input: hey thanks!
Output: hey thanks!`;
  const response = await model.invoke(prompt);
  const content = response?.content;
  return { refineQuery: typeof content === "string" ? content : state.query };
};
export const retrieve: GraphNode<typeof RagState> = async (state) => {
  const filter = state.conversationId
    ? {
        must: [
          {
            key: "metadata.conversationId",
            match: {
              value: state.conversationId,
            },
          },
        ],
      }
    : undefined;

  const docs = await vectorStore.similaritySearch(
    state.refineQuery || state.query,
    8,
    filter,
  );
  return { docs };
};

// evaluator
const UPPER_THRESHOLD = 0.7;
const LOWER_THRESHOLD = 0.3;

export const evaluator: GraphNode<typeof RagState> = async (state) => {
  const good_docs = await Promise.all(
    state.docs.map(async (doc) => {
      const prompt = `You are a relevance scoring assistant. Your task is to evaluate how relevant a retrieved document is to answering a user's question.

Question: ${state.query}

Document:
${doc.pageContent}

Score the document's relevance to the question on a scale from 0.0 to 1.0 using the following criteria:
- 0.0 – 0.29: The document is off-topic or completely unrelated to the question.
- 0.3  – 0.69: The document is loosely related or only partially addresses the question.
- 0.7  – 1.0 : The document is directly relevant and contains information that helps answer the question.

Return only the numeric score.`;
      const score = await model
        .withStructuredOutput(evaluatorLLMSchema)
        .invoke(prompt);
      return { doc, score: score.score };
    }),
  );
  const correct_docs = good_docs
    .filter((d) => d.score >= UPPER_THRESHOLD)
    .map((d) => d.doc);
  const ambiguous_docs = good_docs
    .filter((d) => d.score < UPPER_THRESHOLD && d.score >= LOWER_THRESHOLD)
    .map((d) => d.doc);
  const incorrect_docs = good_docs
    .filter((d) => d.score < LOWER_THRESHOLD)
    .map((d) => d.doc);
  let result: "correct" | "ambiguous" | "incorrect" | null = null;
  if (correct_docs.length > 0) {
    result = "correct";
  } else if (ambiguous_docs.length > 0) {
    result = "ambiguous";
  } else {
    result = "incorrect";
  }
  return {
    evaluator_result: result,
    docs: [...correct_docs, ...ambiguous_docs],
  };
};

export const afterEvaluator: ConditionalEdgeRouter<{
  InputSchema: typeof RagState;
  nodes: "refine" | "web-search";
}> = (state) => {
  if (state.evaluator_result === "correct") {
    return "refine";
  } else if (state.evaluator_result === "ambiguous") {
    return "web-search";
  } else {
    return "web-search";
  }
};

export const webSearchNode: GraphNode<typeof RagState> = async (state) => {
  try {
    const res = await tvly.search(state.refineQuery || state.query, {
      maxResults: 3,
      searchDepth: "basic",
    });

    const docs = res.results
      .filter((r) => r.content?.trim())
      .map(
        (r) =>
          new Document({
            pageContent: r.content,
            metadata: { source: r.url, title: r.title, score: r.score },
          }),
      );
    return { docs };
  } catch (err) {
    console.error("Web search failed:", err);
    return { docs: [] };
  }
};

export const refineDocs: GraphNode<typeof RagState> = async (state) => {
  const results = await Promise.all(
    state.docs.map(async (doc) => {
      const splits = doc.pageContent.split("\n").filter((s) => s.trim());
      const prompt = `You are a relevance filter. Given the user's question and a list of text splits from a document, return ONLY the splits that are directly relevant to answering the question. If none are relevant, return an empty array.

Question: ${state.query}

Document splits:
${splits.map((s) => `${s}`).join("\n")}

Return the relevant splits as-is.`;
      const good_splits = await model
        .withStructuredOutput(refineLLMSchema)
        .invoke(prompt);
      if (good_splits.splits.length !== 0) {
        return new Document({
          pageContent: good_splits.splits.join("\n"),
          metadata: doc.metadata,
        });
      }
      return undefined;
    }),
  );
  const good_docs = results.filter((d): d is Document => d !== undefined);
  return { good_docs };
};

export const generate: GraphNode<typeof RagState> = async (state) => {
  const context = state.docs
    .map((d, i) => `[${i + 1}] ${d.pageContent}`)
    .join("\n\n");

  const response = await model.invoke(
    `Answer the question using ONLY the context below. If the context is insufficient, say so.
    Context:
    ${context}
    Question: ${state.query}
    Answer:`,
  );

  return {
    answer: String(response?.content)?.trim(),
  };
};
