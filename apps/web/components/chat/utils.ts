import { BookOpen, HardDrive } from "lucide-react";
import type { ChatGroup, ChatMessage, Connector } from "./types";

export const primaryButton =
  "bg-[var(--p)] text-[var(--pt)] hover:opacity-90 font-semibold rounded-lg transition";

export const initialChatGroups: ChatGroup[] = [
  {
    group: "Today",
    items: ["Debounce in TypeScript", "Trip ideas: Berlin"],
  },
  {
    group: "Yesterday",
    items: ["RAG pipeline notes"],
  },
  {
    group: "Last 7 days",
    items: ["Kubernetes basics"],
  },
];

export const initialConnectors: Connector[] = [
  { name: "Google Drive", enabled: true, icon: HardDrive },
  { name: "GitHub", enabled: true, icon: HardDrive },
  { name: "Notion", enabled: false, icon: BookOpen },
];

export const demoMessages: ChatMessage[] = [
  {
    id: "demo-user",
    role: "user",
    content: "How do I debounce a search input in TypeScript?",
  },
  {
    id: "demo-assistant",
    role: "assistant",
    content:
      "Wrap the handler in a timer that resets on every keystroke. Here is a small typed helper:",
    code: `export function debounce(fn: Function, ms = 300) {
  let t: number | undefined;
  return (...args: unknown[]) => {
    clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  };
}`,
  },
  {
    id: "demo-user-2",
    role: "user",
    content: "Nice. Can it cancel in-flight requests?",
  },
];

export function getInitials(name: string): string {
  return (name || "AL")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function addChatToGroups(
  groups: ChatGroup[],
  title: string,
): ChatGroup[] {
  const remaining = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item !== title),
    }))
    .filter((group) => group.items.length > 0);

  const today = remaining.find(
    (group) => group.group.toLowerCase() === "today",
  );

  if (today) {
    return remaining.map((group) =>
      group.group.toLowerCase() === "today"
        ? { ...group, items: [title, ...group.items] }
        : group,
    );
  }

  return [{ group: "Today", items: [title] }, ...remaining];
}

export function useDashboardTheme(darkMode: boolean) {
  return {
    muted: darkMode ? "text-[#a1a1aa]" : "text-[#5b6270]",
    heading: darkMode ? "text-[#ffffff]" : "text-[#111111]",
    divider: darkMode ? "border-[#333333]" : "border-[#d9dce1]",
    hover: darkMode ? "hover:bg-[#1f1f1f]" : "hover:bg-[#ebebeb]",
  };
}

export const getLocalResponse = (prompt: string): string =>
  `Zuri is in demo mode. You said: "${prompt}"`;
