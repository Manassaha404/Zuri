import { GraphNode, LangGraphRunnableConfig } from "@langchain/langgraph";
import { MessagesState } from "./state";
import { SystemPromptForMessageLLM } from "./prompt";
import { model, extractor } from "./model";
import { lastOfType, textOf, trimmer } from "./utils";

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
