// Habit Tracker layout
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Habit Tracker · Zuri",
  description:
    "Build momentum, track streaks, stack routines, and analyze habit consistency with mood correlation.",
};

export default function HabitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-full w-full">{children}</div>;
}
