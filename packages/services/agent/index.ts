import { chatDto, chatDtoType } from "./dto-model";
import { Agent } from "./graph";
import { HumanMessage } from "@langchain/core/messages";
import db, { eq, desc, and, sql } from "@repo/database";
import { conversations } from "@repo/database/models";
import { AppError } from "@repo/error";
import { textOf } from "./utils";

class AgentService {
  static async getAllConversations(userId: string) {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  public async getAllConversations(userId: string) {
    return AgentService.getAllConversations(userId);
  }

  static async togglePinConversation(
    conversationId: string,
    userId: string,
    isPinned?: boolean,
  ) {
    const [existing] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.conversationId, conversationId),
          eq(conversations.userId, userId),
        ),
      );

    if (!existing) {
      throw new AppError("NOT_FOUND", "Conversation not found");
    }

    const nextIsPinned =
      typeof isPinned === "boolean" ? isPinned : !existing.isPinned;

    const [updated] = await db
      .update(conversations)
      .set({ isPinned: nextIsPinned })
      .where(
        and(
          eq(conversations.conversationId, conversationId),
          eq(conversations.userId, userId),
        ),
      )
      .returning();

    return updated;
  }

  public async togglePinConversation(
    conversationId: string,
    userId: string,
    isPinned?: boolean,
  ) {
    return AgentService.togglePinConversation(
      conversationId,
      userId,
      isPinned,
    );
  }

  static async pinConversation(
    conversationId: string,
    userId: string,
    isPinned: boolean = true,
  ) {
    return AgentService.togglePinConversation(
      conversationId,
      userId,
      isPinned,
    );
  }

  public async pinConversation(
    conversationId: string,
    userId: string,
    isPinned: boolean = true,
  ) {
    return AgentService.pinConversation(conversationId, userId, isPinned);
  }

  static async updateConversationTitle(
    conversationId: string,
    userId: string,
    title: string,
  ) {
    const trimmed = title.trim();
    if (!trimmed) {
      throw new AppError("BAD_REQUEST", "Title cannot be empty");
    }

    const [updated] = await db
      .update(conversations)
      .set({ title: trimmed, updatedAt: new Date() })
      .where(
        and(
          eq(conversations.conversationId, conversationId),
          eq(conversations.userId, userId),
        ),
      )
      .returning();

    if (!updated) {
      throw new AppError("NOT_FOUND", "Conversation not found");
    }

    return updated;
  }

  public async updateConversationTitle(
    conversationId: string,
    userId: string,
    title: string,
  ) {
    return AgentService.updateConversationTitle(
      conversationId,
      userId,
      title,
    );
  }

  static async deleteConversation(conversationId: string, userId: string) {
    const [deleted] = await db
      .delete(conversations)
      .where(
        and(
          eq(conversations.conversationId, conversationId),
          eq(conversations.userId, userId),
        ),
      )
      .returning();

    if (!deleted) {
      throw new AppError("NOT_FOUND", "Conversation not found");
    }

    try {
      await db.execute(
        sql`DELETE FROM checkpoint_writes WHERE thread_id = ${conversationId}`,
      );
      await db.execute(
        sql`DELETE FROM checkpoint_blobs WHERE thread_id = ${conversationId}`,
      );
      await db.execute(
        sql`DELETE FROM checkpoints WHERE thread_id = ${conversationId}`,
      );
    } catch {
      // Best effort checkpoint cleanup
    }

    return deleted;
  }

  public async deleteConversation(conversationId: string, userId: string) {
    return AgentService.deleteConversation(conversationId, userId);
  }

  static async getConversationMessages(
    conversationId: string,
    userId?: string,
  ) {
    let conversationTitle = "New Chat";
    if (userId) {
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.conversationId, conversationId),
            eq(conversations.userId, userId),
          ),
        );
      if (!conversation) {
        return { conversationId, title: "New Chat", messages: [] };
      }
      conversationTitle = conversation.title;
    }

    const state = await Agent.getState({
      configurable: { thread_id: conversationId },
    });

    const rawMessages = (state?.values as any)?.messages ?? [];

    const messages = rawMessages
      .filter((m: any) => {
        const type =
          m?.type ?? (typeof m?._getType === "function" ? m._getType() : "");
        return type === "human" || type === "ai";
      })
      .map((m: any, index: number) => {
        const type =
          m?.type ?? (typeof m?._getType === "function" ? m._getType() : "");
        const rawContent = m.content;
        const content =
          typeof rawContent === "string"
            ? rawContent
            : Array.isArray(rawContent)
              ? rawContent
                  .map((c: any) =>
                    typeof c === "string" ? c : (c?.text ?? ""),
                  )
                  .join("")
              : (m?.kwargs?.content ?? textOf(rawContent));

        return {
          id: m.id || `${conversationId}-${index}`,
          role: type === "human" ? "user" : "assistant",
          content,
          createdAt:
            m.additional_kwargs?.timestamp ||
            m.response_metadata?.created_at ||
            Date.now(),
        };
      });

    const resolvedTitle = (state?.values as any)?.title || conversationTitle;

    return {
      conversationId,
      title: resolvedTitle,
      messages,
    };
  }

  public async getConversationMessages(
    conversationId: string,
    userId?: string,
  ) {
    return AgentService.getConversationMessages(conversationId, userId);
  }

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
