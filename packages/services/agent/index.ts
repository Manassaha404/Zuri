import fs from "fs";
import { chatDto, chatDtoType } from "./dto-model";
import { Agent } from "./graph";
import { HumanMessage } from "@langchain/core/messages";
import db, { eq, desc, and, sql } from "@repo/database";
import { conversations } from "@repo/database/models";
import { AppError } from "@repo/error";
import {
  isDownloadableUrl,
  downloadRemoteFile,
  splitter,
  textOf,
} from "./utils";
import { store } from "./pg-for-agent";
import { MemoryType } from "./model";
import loadAnyDocument from "./doc-loader";
import { vectorStore } from "./vectorStore";

export interface AgentChatCallbacks {
  onChunk?: (chunk: string) => Promise<void> | void;
}

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
    return AgentService.togglePinConversation(conversationId, userId, isPinned);
  }

  static async pinConversation(
    conversationId: string,
    userId: string,
    isPinned: boolean = true,
  ) {
    return AgentService.togglePinConversation(conversationId, userId, isPinned);
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
    return AgentService.updateConversationTitle(conversationId, userId, title);
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

  static async chat(payload: chatDtoType, callbacks?: AgentChatCallbacks) {
    let { userId, userMessage, conversationId, fileUrls, isFilesInclude } =
      await chatDto.parseAsync(payload);
    const hasFiles = Boolean(
      (fileUrls && fileUrls.length > 0) || isFilesInclude,
    );
    // for safety, conversation id created in trpc call backend
    if (!conversationId) {
      conversationId = crypto.randomUUID();
    }
    // Config for passing conversation id and user id each turn
    const config = {
      configurable: { thread_id: conversationId, user_id: userId },
    };

    if (callbacks?.onChunk) {
      const eventStream = Agent.streamEvents(
        {
          messages: [new HumanMessage(userMessage)],
          isFilesInclude: hasFiles,
        },
        { ...config, version: "v2" },
      );

      for await (const event of eventStream) {
        // Stream token chunks from llm_call, rag_node, or generate (RAG) node
        if (
          event.event === "on_chat_model_stream" &&
          (event.metadata?.langgraph_node === "llm_call" ||
            event.metadata?.langgraph_node === "rag_node" ||
            event.metadata?.langgraph_node === "generate")
        ) {
          const chunk = event.data?.chunk?.content;
          const text = typeof chunk === "string" ? chunk : textOf(chunk);
          if (text) {
            await callbacks.onChunk(text);
          }
        }
      }

      const state = await Agent.getState(config);
      const messages = (state?.values as any)?.messages ?? [];
      const lastMessage = messages[messages.length - 1];
      const output =
        typeof lastMessage?.content === "string"
          ? lastMessage.content
          : Array.isArray(lastMessage?.content)
            ? lastMessage.content
                .map((c: any) => (typeof c === "string" ? c : (c?.text ?? "")))
                .join("")
            : (lastMessage?.kwargs?.content ?? "");

      const title = (state?.values as any)?.title;

      return { conversationId, output, title, result: state?.values };
    }

    const result = await Agent.invoke(
      {
        messages: [new HumanMessage(userMessage)],
        isFilesInclude: hasFiles,
      },
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

  public async chat(payload: chatDtoType, callbacks?: AgentChatCallbacks) {
    return AgentService.chat(payload, callbacks);
  }

  static async getUserMemories(userId: string) {
    if (!userId) {
      throw new AppError("UNAUTHORIZED", "User ID is required");
    }

    const items = await store.search(["memories", userId], {
      limit: 200,
    });

    return items.map((item) => {
      const rawType = item.value?.type ?? item.namespace?.[2] ?? "semantic";
      const type: MemoryType =
        rawType === "profile" ||
        rawType === "episodic" ||
        rawType === "semantic" ||
        rawType === "procedural"
          ? rawType
          : "semantic";

      return {
        key: item.key,
        text: typeof item.value?.text === "string" ? item.value.text : "",
        type,
        namespace: item.namespace,
        createdAt: item.createdAt
          ? new Date(item.createdAt).toISOString()
          : new Date().toISOString(),
        updatedAt: item.updatedAt
          ? new Date(item.updatedAt).toISOString()
          : new Date().toISOString(),
      };
    });
  }

  public async getUserMemories(userId: string) {
    return AgentService.getUserMemories(userId);
  }

  static async createUserMemory(
    userId: string,
    payload: { text: string; type: MemoryType },
  ) {
    if (!userId) {
      throw new AppError("UNAUTHORIZED", "User ID is required");
    }

    const trimmed = payload.text.trim();
    if (!trimmed) {
      throw new AppError("BAD_REQUEST", "Memory text cannot be empty");
    }

    const key = crypto.randomUUID();
    const namespace = ["memories", userId, payload.type];

    await store.put(namespace, key, {
      text: trimmed,
      type: payload.type,
    });

    return {
      key,
      text: trimmed,
      type: payload.type,
      namespace,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  public async createUserMemory(
    userId: string,
    payload: { text: string; type: MemoryType },
  ) {
    return AgentService.createUserMemory(userId, payload);
  }

  static async updateUserMemory(
    userId: string,
    payload: {
      key: string;
      text: string;
      type: MemoryType;
      currentNamespace?: string[];
    },
  ) {
    if (!userId) {
      throw new AppError("UNAUTHORIZED", "User ID is required");
    }

    const trimmed = payload.text.trim();
    if (!trimmed) {
      throw new AppError("BAD_REQUEST", "Memory text cannot be empty");
    }

    const newNamespace = ["memories", userId, payload.type];

    // If current namespace was provided and differs, delete from old namespace
    if (
      payload.currentNamespace &&
      payload.currentNamespace.join("/") !== newNamespace.join("/")
    ) {
      try {
        await store.delete(payload.currentNamespace, payload.key);
      } catch {
        // Ignore deletion error if missing
      }
    }

    await store.put(newNamespace, payload.key, {
      text: trimmed,
      type: payload.type,
    });

    return {
      key: payload.key,
      text: trimmed,
      type: payload.type,
      namespace: newNamespace,
      updatedAt: new Date().toISOString(),
    };
  }

  public async updateUserMemory(
    userId: string,
    payload: {
      key: string;
      text: string;
      type: MemoryType;
      currentNamespace?: string[];
    },
  ) {
    return AgentService.updateUserMemory(userId, payload);
  }

  static async deleteUserMemory(
    userId: string,
    payload: {
      key: string;
      namespace?: string[];
      type?: MemoryType;
    },
  ) {
    if (!userId) {
      throw new AppError("UNAUTHORIZED", "User ID is required");
    }

    const targetNamespace = payload.namespace ?? [
      "memories",
      userId,
      payload.type ?? "semantic",
    ];

    await store.delete(targetNamespace, payload.key);

    return {
      key: payload.key,
      success: true,
    };
  }

  public async deleteUserMemory(
    userId: string,
    payload: {
      key: string;
      namespace?: string[];
      type?: MemoryType;
    },
  ) {
    return AgentService.deleteUserMemory(userId, payload);
  }

  static async ingestDocument(
    source: string,
    metadataOptions?: {
      conversationId?: string | null;
      userId?: string | null;
    },
  ) {
    let localFilePath = source;
    let isTempFile = false;

    try {
      // Download remote file if source is a Cloudinary or remote file URL
      if (isDownloadableUrl(source)) {
        localFilePath = await downloadRemoteFile(source);
        isTempFile = true;
      }

      const docs = await loadAnyDocument(localFilePath);
      const chunks = await splitter.splitDocuments(docs);

      for (const chunk of chunks) {
        if (isTempFile) {
          chunk.metadata.source = source;
        }
        if (metadataOptions?.conversationId) {
          chunk.metadata.conversationId = metadataOptions.conversationId;
        }
        if (metadataOptions?.userId) {
          chunk.metadata.userId = metadataOptions.userId;
        }
      }

      if (chunks.length > 0) {
        await vectorStore.addDocuments(chunks);
      }

      return {
        success: true,
        chunkCount: chunks.length,
      };
    } finally {
      // Clean up temporary downloaded file
      if (isTempFile && localFilePath) {
        await fs.promises.unlink(localFilePath).catch(() => {});
      }
    }
  }

  public async ingestDocument(
    source: string,
    metadataOptions?: {
      conversationId?: string | null;
      userId?: string | null;
    },
  ) {
    return AgentService.ingestDocument(source, metadataOptions);
  }
}
export default AgentService;
