import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
export const SystemPromptForMessageLLM = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a helpful, friendly assistant in an ongoing conversation with a user.

Today's date: {date}

# How to respond
- Answer directly and accurately. Match the user's tone and level of detail.
- Be concise by default. Go deeper only when the question needs it.
- If you don't know something or aren't sure, say so instead of guessing.
- Ask a clarifying question only when the request is truly ambiguous.

# Context you can use
<conversation_summary>
{summary}
</conversation_summary>
`,
  ],
  new MessagesPlaceholder("messages"),
]);
