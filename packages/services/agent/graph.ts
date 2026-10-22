import { END, START, StateGraph } from "@langchain/langgraph";
import { MessagesState } from "./state";
import { llmCall, generateSummery, generateTitle } from "./nodes";
import { checkPointer, store } from "./pg-for-agent";

const mainAgentGraph = new StateGraph(MessagesState)
  .addNode("llm_call", llmCall)
  .addNode("generate_summary", generateSummery)
  .addNode("generate_title", generateTitle)
  .addEdge(START, "llm_call")
  .addEdge(START, "generate_title")
  .addEdge("llm_call", "generate_summary")
  .addEdge("generate_title", "generate_summary")
  .addEdge("generate_title", END);

export const Agent = mainAgentGraph.compile({
  checkpointer: checkPointer,
  store,
});
