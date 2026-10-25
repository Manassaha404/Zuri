import { create } from "zustand";

// Types
export type AgentStatus = "idle" | "running" | "done" | "error";

export interface AttachedFile {
  id: string;
  name: string;
  file?: File;
  url?: string;
  size?: number;
  status: "idle" | "uploading" | "uploaded" | "error";
  error?: string;
}

export interface MessageAttachment {
  name: string;
  url: string;
  size?: number;
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  fileUrls?: string[];
  attachments?: MessageAttachment[];
}

export interface AgentState {
  conversationId: string | null;
  status: AgentStatus;
  messages: AgentMessage[];
  error: string | null;
  title: string | null;
  isTitleUpdating: boolean;
  attachedFiles: AttachedFile[];

  // Actions
  sendUserMessage: (
    userMessage: string,
    fileUrls?: string[],
    attachments?: MessageAttachment[],
  ) => void;
  setConversationId: (id: string) => void;
  setTitle: (title: string) => void;
  setStatus: (status: AgentStatus) => void;
  appendAssistantChunk: (chunk: string) => void;
  appendAssistantMessage: (content: string) => void;
  setMessages: (messages: AgentMessage[]) => void;
  setError: (message: string) => void;
  addAttachedFile: (file: AttachedFile) => void;
  updateAttachedFile: (id: string, updates: Partial<AttachedFile>) => void;
  removeAttachedFile: (id: string) => void;
  clearAttachedFiles: () => void;
  reset: () => void;
}

// Initial state
const INITIAL_STATE: Pick<
  AgentState,
  | "conversationId"
  | "status"
  | "messages"
  | "error"
  | "title"
  | "isTitleUpdating"
  | "attachedFiles"
> = {
  conversationId: null,
  status: "idle",
  messages: [],
  error: null,
  title: null,
  isTitleUpdating: false,
  attachedFiles: [],
};

// Store
export const useAgentStore = create<AgentState>((set, get) => ({
  ...INITIAL_STATE,

  // Optimistic user message
  sendUserMessage: (userMessage, fileUrls, attachments) => {
    const message: AgentMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessage,
      createdAt: Date.now(),
      fileUrls: fileUrls && fileUrls.length > 0 ? fileUrls : undefined,
      attachments:
        attachments && attachments.length > 0 ? attachments : undefined,
    };
    set({
      status: "running",
      error: null,
      messages: [...get().messages, message],
    });
  },

  // Attached files actions
  addAttachedFile: (file) =>
    set({ attachedFiles: [...get().attachedFiles, file] }),
  updateAttachedFile: (id, updates) =>
    set({
      attachedFiles: get().attachedFiles.map((f) =>
        f.id === id ? { ...f, ...updates } : f,
      ),
    }),
  removeAttachedFile: (id) =>
    set({
      attachedFiles: get().attachedFiles.filter((f) => f.id !== id),
    }),
  clearAttachedFiles: () => set({ attachedFiles: [] }),

  // Set conversation ID
  setConversationId: (id) => set({ conversationId: id }),

  // Set title with animation trigger
  setTitle: (title) => {
    const trimmed = title.trim();
    if (!trimmed || trimmed === get().title) return;
    set({ title: trimmed, isTitleUpdating: true });
    setTimeout(() => {
      set({ isTitleUpdating: false });
    }, 1500);
  },

  // Set agent status
  setStatus: (status) => set({ status }),

  // Append streaming chunk
  appendAssistantChunk: (chunk) => {
    if (!chunk) return;
    const messages = get().messages;
    const lastMsg = messages[messages.length - 1];

    if (lastMsg && lastMsg.role === "assistant") {
      const updated = [...messages];
      updated[updated.length - 1] = {
        ...lastMsg,
        content: lastMsg.content + chunk,
      };
      set({ messages: updated, status: "running" });
      return;
    }

    const message: AgentMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: chunk,
      createdAt: Date.now(),
    };
    set({
      status: "running",
      messages: [...messages, message],
    });
  },

  // Finalize assistant message
  appendAssistantMessage: (content) => {
    const trimmed = content.trim();
    const messages = get().messages;
    const lastMsg = messages[messages.length - 1];

    // Synchronize final content with streamed assistant message
    if (lastMsg && lastMsg.role === "assistant") {
      if (trimmed && lastMsg.content !== trimmed) {
        const updated = [...messages];
        updated[updated.length - 1] = {
          ...lastMsg,
          content: trimmed,
        };
        set({ status: "done", messages: updated });
        return;
      }
      set({ status: "done" });
      return;
    }

    if (!trimmed) {
      set({ status: "done" });
      return;
    }

    const message: AgentMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: trimmed,
      createdAt: Date.now(),
    };
    set({
      status: "done",
      messages: [...messages, message],
    });
  },

  // Set past messages directly from backend history
  setMessages: (messages) => set({ messages, error: null }),

  // Set error
  setError: (message) => set({ status: "error", error: message }),

  // Reset store
  reset: () => set({ ...INITIAL_STATE }),
}));
