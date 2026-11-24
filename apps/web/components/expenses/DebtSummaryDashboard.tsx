// Summary dashboard for Debt Ledger: Total to Receive, Total to Pay, Net Position, Overdue Highlights
"use client";

import { useMemo } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  AlertCircle,
  Plus,
  Users,
  CheckCircle2,
} from "lucide-react";
import { useExpenseStore } from "@/store/expenseStore";
import {
  calculateEntryBalance,
  calculatePersonNetBalance,
  formatCurrency,
} from "@/lib/expenseUtils";

interface DebtSummaryDashboardProps {
  onOpenNewEntry: () => void;
  onSelectPerson: (personId: string) => void;
}

export function DebtSummaryDashboard({
  onOpenNewEntry,
  onSelectPerson,
}: DebtSummaryDashboardProps) {
  const { people, debtEntries, currency } = useExpenseStore();

  // Aggregate totals across all people
  const stats = useMemo(() => {
    let totalToReceive = 0;
    let totalToPay = 0;
    let overdueCount = 0;
    const today = new Date().toISOString().slice(0, 10);

    for (const entry of debtEntries) {
      if (entry.isSettled) continue;
      const balance = calculateEntryBalance(entry);
      if (balance <= 0) continue;

      if (entry.type === "lent") {
        totalToReceive += balance;
      } else {
        totalToPay += balance;
      }

      if (entry.dueDate && entry.dueDate < today) {
        overdueCount++;
      }
    }

    const netPosition = totalToReceive - totalToPay;

    return {
      totalToReceive,
      totalToPay,
      netPosition,
      overdueCount,
    };
  }, [debtEntries]);

  return (
    <div className="flex flex-col gap-4">
      {/* 3 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total to Receive */}
        <div className="p-4 rounded-2xl border border-[var(--h)] bg-[var(--surface-card)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--m)]">
              Total to Receive
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ArrowUpRight size={15} />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-xl font-bold tracking-tight text-emerald-500">
              {formatCurrency(stats.totalToReceive, currency)}
            </h4>
            <p className="text-[11px] text-[var(--m)] mt-0.5">
              Owed to you by contacts
            </p>
          </div>
        </div>

        {/* Total to Pay */}
        <div className="p-4 rounded-2xl border border-[var(--h)] bg-[var(--surface-card)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--m)]">
              Total to Pay
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <ArrowDownLeft size={15} />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-xl font-bold tracking-tight text-rose-500">
              {formatCurrency(stats.totalToPay, currency)}
            </h4>
            <p className="text-[11px] text-[var(--m)] mt-0.5">You owe others</p>
          </div>
        </div>

        {/* Net Position */}
        <div className="p-4 rounded-2xl border border-[var(--h)] bg-[var(--surface-card)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--m)]">
              Net Position
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Scale size={15} />
            </div>
          </div>
          <div className="mt-2">
            <h4
              className={`text-xl font-bold tracking-tight ${
                stats.netPosition > 0
                  ? "text-emerald-500"
                  : stats.netPosition < 0
                    ? "text-rose-500"
                    : "text-[var(--i)]"
              }`}
            >
              {stats.netPosition > 0 ? "+" : ""}
              {formatCurrency(stats.netPosition, currency)}
            </h4>
            <p className="text-[11px] text-[var(--m)] mt-0.5">
              {stats.netPosition > 0
                ? "Overall you are in credit"
                : stats.netPosition < 0
                  ? "Overall you are in debt"
                  : "All settled up clean"}
            </p>
          </div>
        </div>
      </div>

      {/* Overdue alert banner if any */}
      {stats.overdueCount > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0" />
            <div className="text-xs">
              <span className="font-semibold">
                {stats.overdueCount}{" "}
                {stats.overdueCount === 1 ? "entry is" : "entries are"} overdue!
              </span>
              <span className="opacity-80 ml-1.5 hidden sm:inline">
                Follow up or send reminder to settle open balances.
              </span>
            </div>
          </div>
          <span className="text-[11px] font-semibold underline cursor-pointer">
            View Overdue
          </span>
        </div>
      )}
    </div>
  );
}
