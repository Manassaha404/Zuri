import { create } from "zustand";

// Types
export type AgentStatus = "idle" | "running" | "done" | "error";

export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export interface AgentState {
  conversationId: string | null;
  status: AgentStatus;
  messages: AgentMessage[];
  error: string | null;
  title: string | null;
  isTitleUpdating: boolean;

  // Actions
  sendUserMessage: (userMessage: string) => void;
  setConversationId: (id: string) => void;
  setTitle: (title: string) => void;
  setStatus: (status: AgentStatus) => void;
  appendAssistantMessage: (content: string) => void;
  setError: (message: string) => void;
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
> = {
  conversationId: null,
  status: "idle",
  messages: [],
  error: null,
  title: null,
  isTitleUpdating: false,
};

// Store
export const useAgentStore = create<AgentState>((set, get) => ({
  ...INITIAL_STATE,

  // Optimistic user message
  sendUserMessage: (userMessage) => {
    const message: AgentMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessage,
      createdAt: Date.now(),
    };
    set({
      status: "running",
      error: null,
      messages: [...get().messages, message],
    });
  },

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

  // Append assistant message and deduplicate
  appendAssistantMessage: (content) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const messages = get().messages;
    const lastMsg = messages[messages.length - 1];

    // Deduplicate identical consecutive assistant message
    if (
      lastMsg &&
      lastMsg.role === "assistant" &&
      lastMsg.content === trimmed
    ) {
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

  // Set error
  setError: (message) => set({ status: "error", error: message }),

  // Reset store
  reset: () => set({ ...INITIAL_STATE }),
}));
