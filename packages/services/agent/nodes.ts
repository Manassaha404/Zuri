import { GraphNode, LangGraphRunnableConfig } from "@langchain/langgraph";
import { MessagesState } from "./state";
import { SystemPromptForMessageLLM } from "./prompt";
import model from "./model";
import { textOf, trimmer } from "./utils";

export const llmCall: GraphNode<typeof MessagesState> = async (
  state,
  config: LangGraphRunnableConfig,
) => {
  const userId = config.configurable?.user_id ?? "anonymous";
  const trimmed = await trimmer.invoke(state.messages);

  const promptValue = await SystemPromptForMessageLLM.invoke({
    date: new Date().toISOString().slice(0, 10),
    summary: state.summery || "No summary yet.",
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
}; // title generate node for the conversation
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
