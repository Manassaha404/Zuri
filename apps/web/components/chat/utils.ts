import { BookOpen, HardDrive } from "lucide-react";
import type { ChatGroup, Connector } from "./types";

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
