import { HardDrive } from "lucide-react";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  code?: string;
};

export type ChatItem = {
  id: string;
  title: string;
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
  id: number;
  title: string;
};

export type User = {
  name: string;
  email: string;
};
