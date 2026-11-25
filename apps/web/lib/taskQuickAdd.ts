// Natural language quick-add parser for Task Tracker
import type { TaskPriority, TaskRecurrence } from "@/components/tasks/types";

export interface ParsedQuickTask {
  title: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority?: TaskPriority;
  tags: string[];
  projectName?: string;
  estimateMinutes?: number;
  recurrence?: TaskRecurrence;
}

function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseQuickAddTask(rawInput: string): ParsedQuickTask {
  let text = rawInput.trim();
  const tags: string[] = [];
  let priority: TaskPriority | undefined;
  let projectName: string | undefined;
  let dueDate: string | undefined;
  let dueTime: string | undefined;
  let estimateMinutes: number | undefined;
  let recurrence: TaskRecurrence | undefined;

  // Extract #tags
  text = text.replace(/#([a-zA-Z0-9_-]+)/g, (_, tag: string) => {
    tags.push(tag);
    return "";
  });

  // Extract @Project
  text = text.replace(/@([a-zA-Z0-9_-]+)/g, (_, proj: string) => {
    projectName = proj;
    return "";
  });

  // Extract priority (!urgent, !high, !medium, !low, p1..p4)
  text = text.replace(
    /\b(?:!(urgent|high|medium|low)|p([1-4]))\b/gi,
    (_, word?: string, num?: string) => {
      if (word) {
        priority = word.toLowerCase() as TaskPriority;
      } else if (num === "1") {
        priority = "urgent";
      } else if (num === "2") {
        priority = "high";
      } else if (num === "3") {
        priority = "medium";
      } else if (num === "4") {
        priority = "low";
      }
      return "";
    },
  );

  // Extract time estimate (~30m, ~1h, ~1.5h)
  text = text.replace(
    /~(\d+(?:\.\d+)?)\s*(h|hr|hrs|m|min|mins)\b/gi,
    (_, val: string, unit: string) => {
      const n = parseFloat(val);
      if (!Number.isNaN(n)) {
        estimateMinutes = unit.toLowerCase().startsWith("h")
          ? Math.round(n * 60)
          : Math.round(n);
      }
      return "";
    },
  );

  // Extract recurrence
  const recMatch = text.match(
    /\b(every day|daily|every week|weekly|every 2 weeks|biweekly|every month|monthly)\b/i,
  );
  if (recMatch && recMatch[1]) {
    const matched = recMatch[1].toLowerCase();
    if (matched.includes("day") || matched === "daily") recurrence = "daily";
    else if (matched.includes("2 weeks") || matched === "biweekly")
      recurrence = "biweekly";
    else if (matched.includes("week") || matched === "weekly")
      recurrence = "weekly";
    else if (matched.includes("month") || matched === "monthly")
      recurrence = "monthly";
    text = text.replace(recMatch[0], "");
  }

  // Extract time (e.g. 5pm, 5:30pm, 14:00, 9am)
  const timeMatch = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (timeMatch && timeMatch[1] && (timeMatch[3] || timeMatch[2])) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();
    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      dueTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      text = text.replace(timeMatch[0], "");
    }
  }

  // Extract relative date keywords
  const now = new Date();
  const datePatterns: Array<{ regex: RegExp; offsetDays: number }> = [
    { regex: /\btoday\b/i, offsetDays: 0 },
    { regex: /\btomorrow\b|\btmr\b/i, offsetDays: 1 },
    { regex: /\bnext week\b/i, offsetDays: 7 },
  ];

  for (const { regex, offsetDays } of datePatterns) {
    if (regex.test(text)) {
      const target = new Date(now);
      target.setDate(target.getDate() + offsetDays);
      dueDate = formatDateLocal(target);
      text = text.replace(regex, "");
      break;
    }
  }

  // Weekday matching if no relative date matched yet
  if (!dueDate) {
    const weekdays = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const weekdayRegex = new RegExp(
      `\\b(?:next\\s+)?(${weekdays.join("|")})\\b`,
      "i",
    );
    const wdMatch = text.match(weekdayRegex);
    if (wdMatch && wdMatch[1]) {
      const targetDay = weekdays.indexOf(wdMatch[1].toLowerCase());
      const currentDay = now.getDay();
      let delta = (targetDay - currentDay + 7) % 7;
      if (delta === 0) delta = 7;
      const target = new Date(now);
      target.setDate(target.getDate() + delta);
      dueDate = formatDateLocal(target);
      text = text.replace(wdMatch[0], "");
    }
  }

  // Clean up extra whitespace and trailing prepositions like "at"
  const cleanedTitle = text
    .replace(/\s+\bat\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return {
    title: cleanedTitle || rawInput.trim(),
    dueDate,
    dueTime,
    priority,
    tags,
    projectName,
    estimateMinutes,
    recurrence,
  };
}
