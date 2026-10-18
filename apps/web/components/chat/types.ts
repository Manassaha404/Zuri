import { HardDrive } from "lucide-react";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  code?: string;
};

export type ChatGroup = {
  group: string;
  items: string[];
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
