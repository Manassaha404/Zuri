import { BookOpen, HardDrive } from "lucide-react";
import type { ChatGroup, ChatItem, Connector } from "./types";

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

// Group conversations by relative date
export function formatConversationsToGroups(
  conversations: Array<{
    conversationId: string;
    title: string;
    isPinned?: boolean;
    createdAt?: string | Date;
    updatedAt?: string | Date;
  }>,
): ChatGroup[] {
  if (!conversations || conversations.length === 0) return [];

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  type GroupKey = "Today" | "Yesterday" | "Last 7 days" | "Older";
  const groups: Record<GroupKey, ChatItem[]> = {
    Today: [],
    Yesterday: [],
    "Last 7 days": [],
    Older: [],
  };

  for (const conv of conversations) {
    const rawDate = conv.updatedAt || conv.createdAt;
    const date = rawDate ? new Date(rawDate) : new Date();
    const item: ChatItem = {
      id: conv.conversationId,
      title: conv.title || "Untitled Chat",
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };

    if (date >= startOfToday) {
      groups["Today"].push(item);
    } else if (date >= startOfYesterday) {
      groups["Yesterday"].push(item);
    } else if (date >= sevenDaysAgo) {
      groups["Last 7 days"].push(item);
    } else {
      groups["Older"].push(item);
    }
  }

  const order: GroupKey[] = ["Today", "Yesterday", "Last 7 days", "Older"];
  return order
    .filter((groupName) => groups[groupName].length > 0)
    .map((groupName) => ({
      group: groupName,
      items: groups[groupName],
    }));
}

// Add or prepend chat to groups
export function addChatToGroups(
  groups: ChatGroup[],
  chat: string | ChatItem,
): ChatGroup[] {
  const title = typeof chat === "string" ? chat : chat.title;
  const item: ChatItem | string = chat;

  const remaining = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((i) => {
        const itemTitle = typeof i === "string" ? i : i.title;
        return itemTitle !== title;
      }),
    }))
    .filter((group) => group.items.length > 0);

  const today = remaining.find(
    (group) => group.group.toLowerCase() === "today",
  );

  if (today) {
    return remaining.map((group) =>
      group.group.toLowerCase() === "today"
        ? { ...group, items: [item, ...group.items] }
        : group,
    );
  }

  return [{ group: "Today", items: [item] }, ...remaining];
}

export function useDashboardTheme(darkMode: boolean) {
  return {
    muted: darkMode ? "text-[#a1a1aa]" : "text-[#5b6270]",
    heading: darkMode ? "text-[#ffffff]" : "text-[#111111]",
    divider: darkMode ? "border-[#333333]" : "border-[#d9dce1]",
    hover: darkMode ? "hover:bg-[#1f1f1f]" : "hover:bg-[#ebebeb]",
  };
}
