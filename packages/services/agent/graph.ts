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
  selectTools,
  connect,
  waitConnection,
  afterConnect,
  riskCheck,
  approve,
  toolsNode,
  decideRag,
  afterSelect,
  afterLlm,
  afterRisk,
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
  .addNode("selectTools", selectTools)
  .addNode("connect", connect)
  .addNode("wait_connection", waitConnection)
  .addNode("riskCheck", riskCheck)
  .addNode("approve", approve)
  .addNode("tools", toolsNode)
  .addNode("generate_title", generateTitle)
  .addNode("generate_memories", generateLongTermMemory)
  .addNode("decide_rag", decideRag)
  .addEdge(START, "decide_rag")
  .addEdge(START, "generate_title")
  .addEdge("decide_rag", "selectTools")
  .addEdge("generate_title", END)
  .addConditionalEdges("selectTools", afterSelect, ["connect", "llm_call"])
  .addEdge("connect", "wait_connection")
  .addConditionalEdges("wait_connection", afterConnect, ["llm_call", END])
  .addConditionalEdges("llm_call", afterLlm, [
    "riskCheck",
    "generate_summary",
    "generate_memories",
    END,
  ])
  .addConditionalEdges("riskCheck", afterRisk, ["approve", "tools"])
  .addEdge("approve", "tools")
  .addEdge("tools", "llm_call")
  .addEdge("generate_summary", END)
  .addEdge("generate_memories", END);

export const Agent = mainAgentGraph.compile({
  checkpointer: checkPointer,
  store,
});
