import { HardDrive } from "lucide-react";

export type ChatAttachment = {
  name: string;
  url: string;
  size?: number;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  code?: string;
  fileUrls?: string[];
  attachments?: ChatAttachment[];
};

export type ChatItem = {
  id: string;
  title: string;
  isPinned?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type ChatGroup = {
  group: string;
  items: (string | ChatItem)[];
};

export type Connector = {
  name: string;
  enabled: boolean;
  icon: typeof HardDrive;
};

export type PinnedMessage = {
  id: string | number;
  title: string;
  conversationId?: string;
  isPinned?: boolean;
};

export type PinnedConversation = {
  id: string;
  conversationId: string;
  title: string;
  isPinned?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type User = {
  name: string;
  email: string;
};
