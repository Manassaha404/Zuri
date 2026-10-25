import { END, START, StateGraph } from "@langchain/langgraph";
import { MessagesState, RagState } from "./state";
import {
  llmCall,
  generateSummery,
  generateTitle,
  generateLongTermMemory,
  retrieve,
  generate,
  evaluator,
  webSearchNode,
  refineDocs,
  stepBackQuery,
  afterEvaluator,
  ragNode,
  isRagRequiredOrNot,
} from "./nodes";
import { checkPointer, store } from "./pg-for-agent";

// Sub-graph for RAG pipeline
const graph = new StateGraph(RagState)
  .addNode("retrieve", retrieve)
  .addNode("generate", generate)
  .addNode("evaluator", evaluator)
  .addNode("web-search", webSearchNode)
  .addNode("refine", refineDocs)
  .addNode("step-back-query", stepBackQuery)
  .addEdge(START, "step-back-query")
  .addEdge("step-back-query", "retrieve")
  .addEdge("retrieve", "evaluator")
  .addConditionalEdges("evaluator", afterEvaluator)
  .addEdge("web-search", "refine")
  .addEdge("refine", "generate")
  .addEdge("generate", END);
export const ragAgent = graph.compile();

// Main agent graph
const mainAgentGraph = new StateGraph(MessagesState)
  .addNode("llm_call", llmCall)
  .addNode("generate_summary", generateSummery)
  .addNode("generate_title", generateTitle)
  .addNode("generate_memories", generateLongTermMemory)
  .addNode("rag_node", ragNode)
  .addConditionalEdges(START, isRagRequiredOrNot)
  .addEdge(START, "generate_title")
  .addEdge("rag_node", "generate_summary")
  .addEdge("llm_call", "generate_summary")
  .addEdge("generate_title", "generate_summary")
  .addEdge("generate_summary", "generate_memories")
  .addEdge("generate_memories", END);

export const Agent = mainAgentGraph.compile({
  checkpointer: checkPointer,
  store,
});
