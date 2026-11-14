import { ConditionalEdgeRouter, GraphNode } from "@langchain/langgraph";
import { Document } from "@langchain/core/documents";
import { RagState } from "../state";
import {
  model,
  nanoModel,
  evaluatorLLMSchema,
  tvly,
  refineLLMSchema,
  checkFullFileContextJudge,
  crossFileComparisonJudge,
  docSummeryLLM,
} from "../model";
import { vectorStore } from "../vectorStore";

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
  const response = await nanoModel.invoke(prompt);
  const content = response?.content;
  return { refineQuery: typeof content === "string" ? content : state.query };
};

export const checkIfFullFileContextNeeded: GraphNode<typeof RagState> = async (
  state,
) => {
  const { query, currentFileUrls } = state;
  const prompt = `You are a context evaluation engine. Determine if answering the user's message requires retrieving context from the full content of uploaded files or specific sections/summaries. True means full file context is needed, false means only specific sections or summaries are sufficient.

User query: "${query}"`;
  const response = await checkFullFileContextJudge.invoke(prompt);

  let targetFileUrls: string[] = [];
  if (currentFileUrls && currentFileUrls.length > 0) {
    // Check if query explicitly asks to compare with or reference historical files
    try {
      const comparisonPrompt = `The user attached new file(s) in this message.
Determine whether answering their question requires referencing, comparing with, or searching files/videos from previous turns in the conversation.
Return false if the user is only asking about the newly attached file(s) (e.g. "summarize this", "what is this video about", "explain this file").
Return true ONLY if they explicitly ask to compare or combine with earlier files (e.g. "compare this with the previous file").

User query: "${query}"`;
      const comparisonRes =
        await crossFileComparisonJudge.invoke(comparisonPrompt);
      if (!comparisonRes.needsHistoricalFiles) {
        targetFileUrls = currentFileUrls;
      }
    } catch {
      // Default to newly attached files if evaluation fails
      targetFileUrls = currentFileUrls;
    }
  }

  return {
    isFullFileContextNeeded: response.isFullFileContextNeeded,
    targetFileUrls,
  };
};

export const retrieve: GraphNode<typeof RagState> = async (state) => {
  const { isFullFileContextNeeded, targetFileUrls } = state;

  const mustClauses: any[] = [];
  if (state.conversationId) {
    mustClauses.push({
      key: "metadata.conversationId",
      match: {
        value: state.conversationId,
      },
    });
  }

  // Filter by metadata.source to isolate chunks from target file(s)
  if (targetFileUrls && targetFileUrls.length > 0) {
    if (targetFileUrls.length === 1) {
      mustClauses.push({
        key: "metadata.source",
        match: {
          value: targetFileUrls[0],
        },
      });
    } else {
      mustClauses.push({
        should: targetFileUrls.map((url) => ({
          key: "metadata.source",
          match: {
            value: url,
          },
        })),
      });
    }
  }

  const filter = mustClauses.length > 0 ? { must: mustClauses } : undefined;
  let k = 8;
  if (isFullFileContextNeeded) {
    k = 100;
  }
  const docs = await vectorStore.similaritySearch(
    state.refineQuery || state.query,
    k,
    filter,
  );
  return { docs };
};

// Concurrency limit for document summarization
const SUMMARIZE_CONCURRENCY = 20;

// Summarize all documents into concise summaries and store in good_docs
export const summarizeAllDocs: GraphNode<typeof RagState> = async (state) => {
  const { docs } = state;

  const results: Document[] = new Array(docs.length);
  let currentIndex = 0;

  const workers = Array.from(
    { length: Math.min(SUMMARIZE_CONCURRENCY, docs.length) },
    async () => {
      while (currentIndex < docs.length) {
        const idx = currentIndex++;
        const doc = docs[idx]!;
        const prompt = `Generate a concise summary (1-4 sentences) of the following document excerpt:

Document:
${doc.pageContent}

Return only the brief summary.`;
        try {
          const response = await docSummeryLLM.invoke(prompt);
          const content = response?.summery?.trim();
          results[idx] = new Document({
            id: doc.id,
            pageContent: content || doc.pageContent,
            metadata: doc.metadata,
          });
        } catch (err) {
          console.error(
            `[summarizeAllDocs] error summarizing doc ${idx}:`,
            err,
          );
          results[idx] = doc;
        }
      }
    },
  );

  await Promise.all(workers);
  return { good_docs: results };
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
      const score = await nanoModel
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

export const afterRetrieve: ConditionalEdgeRouter<{
  InputSchema: typeof RagState;
  nodes: "summarize-all-docs" | "evaluator";
}> = (state) => {
  if (state.isFullFileContextNeeded) {
    return "summarize-all-docs";
  } else {
    return "evaluator";
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
      const good_splits = await nanoModel
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
  const context = state.isFullFileContextNeeded
    ? state.good_docs.map((d, i) => `[${i + 1}] ${d.pageContent}`).join("\n\n")
    : state.docs.map((d, i) => `[${i + 1}] ${d.pageContent}`).join("\n\n");

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
