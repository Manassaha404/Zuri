import {
  Command,
  END,
  interrupt,
  MessagesValue,
  START,
  StateGraph,
  StateSchema,
  type GraphNode,
  type LangGraphRunnableConfig,
} from "@langchain/langgraph";
import { chatDto, chatDtoType } from "./dto-model";
import { Agent } from "./graph";
import { HumanMessage } from "@langchain/core/messages";
class AgentService {
  static async chat(payload: chatDtoType) {
    let { userId, userMessage, conversationId } =
      await chatDto.parseAsync(payload);
    if (!conversationId) {
      conversationId = crypto.randomUUID();
    }
    //config for passing conversation id and user id each turn
    const config = {
      configurable: { thread_id: conversationId, user_id: userId },
    };
    const result = await Agent.invoke(
      { messages: [new HumanMessage(userMessage)] },
      config,
    );
    const messages = (result as any)?.messages ?? [];
    const lastMessage = messages[messages.length - 1];
    const output =
      typeof lastMessage?.content === "string"
        ? lastMessage.content
        : Array.isArray(lastMessage?.content)
          ? lastMessage.content
              .map((c: any) => (typeof c === "string" ? c : (c?.text ?? "")))
              .join("")
          : (lastMessage?.kwargs?.content ?? "");

    const title = result.title;

    return { conversationId, output, title, result };
  }
}
export default AgentService;
