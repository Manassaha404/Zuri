import type {
  DeadlineItem,
  UrgencyLevel,
  DeadlineStats,
} from "../components/deadlines/types";

// Calculates countdown display and color urgency
export function getDeadlineCountdown(
  dueDateStr: string,
  status: DeadlineItem["status"],
): {
  text: string;
  subtext: string;
  urgency: UrgencyLevel;
  daysRemaining: number;
  hoursRemaining: number;
  isOverdue: boolean;
} {
  if (status === "done") {
    return {
      text: "Completed",
      subtext: "On time",
      urgency: "green",
      daysRemaining: 0,
      hoursRemaining: 0,
      isOverdue: false,
    };
  }

  const now = new Date();
  const due = new Date(dueDateStr);
  const diffMs = due.getTime() - now.getTime();
  const isOverdue = diffMs < 0;

  const totalHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (isOverdue) {
    const overdueText =
      days > 0 ? `${days}d ${hours}h overdue` : `${hours}h overdue`;
    return {
      text: overdueText,
      subtext: "Action required immediately",
      urgency: "critical",
      daysRemaining: -days,
      hoursRemaining: -totalHours,
      isOverdue: true,
    };
  }

  // Future countdown
  let text = "";
  if (days === 0 && hours === 0) {
    text = "Due now";
  } else if (days === 0) {
    text = `${hours}h remaining`;
  } else if (days === 1) {
    text = `1 day, ${hours}h left`;
  } else {
    text = `${days} days left`;
  }

  let urgency: UrgencyLevel = "green";
  if (days <= 1) {
    urgency = "red";
  } else if (days <= 3) {
    urgency = "amber";
  } else {
    urgency = "green";
  }

  const subtext = due.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    text,
    subtext,
    urgency,
    daysRemaining: days,
    hoursRemaining: totalHours,
    isOverdue: false,
  };
}

// Compute statistics across deadlines
export function computeDeadlineStats(deadlines: DeadlineItem[]): DeadlineStats {
  const total = deadlines.length;
  const completed = deadlines.filter((d) => d.status === "done").length;
  const missedCount = deadlines.filter((d) => {
    if (d.status === "missed") return true;
    if (d.status !== "done" && new Date(d.dueDate).getTime() < Date.now()) {
      return true;
    }
    return false;
  }).length;

  const onTimeCount = completed;
  const evaluatedCount = completed + missedCount;
  const onTimeRate =
    evaluatedCount > 0
      ? Math.round((onTimeCount / evaluatedCount) * 1000) / 10
      : 100;

  const atRiskCount = deadlines.filter((d) => {
    if (d.status === "done") return false;
    const { daysRemaining, isOverdue } = getDeadlineCountdown(
      d.dueDate,
      d.status,
    );
    return isOverdue || daysRemaining <= 1;
  }).length;

  return {
    total,
    completed,
    onTimeCount,
    missedCount,
    onTimeRate,
    atRiskCount,
  };
}
