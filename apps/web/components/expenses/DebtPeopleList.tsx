// Per-person debt ledger list with running balances, settlement actions, and reminders
"use client";

import { useMemo, useState } from "react";
import {
  User,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Send,
  Plus,
  Scale,
} from "lucide-react";
import { useExpenses } from "@/hook/expenses";
import { calculatePersonNetBalance, formatCurrency } from "@/lib/expenseUtils";

interface DebtPeopleListProps {
  onSelectPerson: (personId: string) => void;
  onOpenAddModal: (personId?: string) => void;
  onOpenAddPersonModal?: () => void;
  selectedPersonId: string | null;
}

export function DebtPeopleList({
  onSelectPerson,
  onOpenAddModal,
  onOpenAddPersonModal,
  selectedPersonId,
}: DebtPeopleListProps) {
  const { people, debtEntries, currency, settlePersonDebts } = useExpenses();
  const [filterType, setFilterType] = useState<
    "all" | "owe_me" | "i_owe" | "settled"
  >("all");

  const peopleWithBalances = useMemo(() => {
    return people
      .filter((p) => p.id !== "p_you")
      .map((person) => {
        const stats = calculatePersonNetBalance(person.id, debtEntries);
        return {
          ...person,
          stats,
        };
      })
      .filter((p) => {
        if (filterType === "owe_me") return p.stats.netBalance > 0.01;
        if (filterType === "i_owe") return p.stats.netBalance < -0.01;
        if (filterType === "settled")
          return Math.abs(p.stats.netBalance) <= 0.01;
        return true;
      })
      .sort(
        (a, b) => Math.abs(b.stats.netBalance) - Math.abs(a.stats.netBalance),
      );
  }, [people, debtEntries, filterType]);

  const handleSendReminder = (
    e: React.MouseEvent,
    personName: string,
    amount: number,
  ) => {
    e.stopPropagation();
    alert(
      `Friendly reminder drafted for ${personName} for ${formatCurrency(amount, currency)}. Sent via notification!`,
    );
  };

  const handleSettleUp = (
    e: React.MouseEvent,
    personId: string,
    personName: string,
  ) => {
    e.stopPropagation();
    if (confirm(`Zero out and settle all open balances with ${personName}?`)) {
      settlePersonDebts(personId);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Filter Tabs & New Entry Action Row */}
      <div className="flex sm:flex-row sm:items-center gap-2.5 w-full">
        {/* Full-width responsive filter segment */}
        <div className="flex-1 min-w-100 bg-[var(--s)] border border-[var(--h)] rounded-full p-1 flex items-center justify-between gap-1 overflow-x-auto styled-scrollbar">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`flex-1 min-w-[70px] py-1.5 px-3 text-xs font-semibold rounded-full whitespace-nowrap text-center transition-all cursor-pointer ${
              filterType === "all"
                ? "bg-[var(--p)] text-[var(--pt)] shadow-2xs"
                : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--h)]/40"
            }`}
          >
            All ({people.length - 1})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("owe_me")}
            className={`flex-1 min-w-[75px] py-1.5 px-3 text-xs font-semibold rounded-full whitespace-nowrap justify-center transition-all flex items-center gap-1 cursor-pointer ${
              filterType === "owe_me"
                ? "bg-emerald-500 text-white shadow-2xs"
                : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--h)]/40"
            }`}
          >
            <ArrowUpRight size={12} className="shrink-0" />
            <span>Owes Me</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType("i_owe")}
            className={`flex-1 min-w-[65px] py-1.5 px-3 text-xs font-semibold rounded-full whitespace-nowrap justify-center transition-all flex items-center gap-1 cursor-pointer ${
              filterType === "i_owe"
                ? "bg-rose-500 text-white shadow-2xs"
                : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--h)]/40"
            }`}
          >
            <ArrowDownLeft size={12} className="shrink-0" />
            <span>I Owe</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType("settled")}
            className={`flex-1 min-w-[65px] py-1.5 px-3 text-xs font-semibold rounded-full whitespace-nowrap text-center transition-all cursor-pointer ${
              filterType === "settled"
                ? "bg-[var(--p)] text-[var(--pt)] shadow-2xs"
                : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--h)]/40"
            }`}
          >
            Settled
          </button>
        </div>

        {/* Compact Actions: Add Person & New Entry */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          {onOpenAddPersonModal && (
            <button
              type="button"
              onClick={onOpenAddPersonModal}
              className="bt text-xs font-semibold px-2.5 py-1.5 flex items-center gap-1 text-[var(--i)]"
              title="Add a new contact"
            >
              <Plus size={13} className="text-blue-500" />
              <span>Person</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenAddModal()}
            className="bt p text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 whitespace-nowrap"
            title="Record a new debt entry"
          >
            <Plus size={13} />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* People Card Grid / List */}
      <div className="flex flex-col gap-2">
        {peopleWithBalances.length === 0 ? (
          <div className="p-8 text-center border border-[var(--h)] rounded-2xl bg-[var(--surface-card)]">
            <p className="text-xs text-[var(--m)]">
              No contacts found in this category
            </p>
          </div>
        ) : (
          peopleWithBalances.map((person) => {
            const isOwed = person.stats.netBalance > 0.01;
            const owes = person.stats.netBalance < -0.01;
            const isSettled = !isOwed && !owes;
            const isSelected = selectedPersonId === person.id;

            return (
              <div
                key={person.id}
                onClick={() => onSelectPerson(person.id)}
                className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-[var(--p)] bg-[var(--s)] shadow-xs"
                    : "border-[var(--h)] bg-[var(--surface-card)] hover:border-[var(--m)]/60"
                }`}
              >
                {/* Person details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-500/20">
                    {person.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--i)] truncate">
                        {person.name}
                      </span>
                      {person.stats.hasOverdue && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[10px] font-semibold bg-rose-500/15 text-rose-500 border border-rose-500/20">
                          <AlertCircle size={10} />
                          Overdue
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[var(--m)] truncate">
                      {person.notes ||
                        person.phone ||
                        person.email ||
                        "No contact info"}
                    </span>
                  </div>
                </div>

                {/* Right: Running Balance, Settle-Up button & Reminder action */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-bold tracking-tight">
                      {isOwed ? (
                        <span className="text-emerald-500">
                          +{formatCurrency(person.stats.netBalance, currency)}
                        </span>
                      ) : owes ? (
                        <span className="text-rose-500">
                          {formatCurrency(person.stats.netBalance, currency)}
                        </span>
                      ) : (
                        <span className="text-[var(--m)] text-xs font-semibold flex items-center gap-1">
                          <CheckCircle2
                            size={13}
                            className="text-emerald-500"
                          />
                          Settled Up
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--m)]">
                      {isOwed ? "owes you" : owes ? "you owe" : "zero balance"}
                    </span>
                  </div>

                  {/* Actions cluster */}
                  <div className="flex items-center gap-1">
                    {!isSettled && (
                      <button
                        type="button"
                        onClick={(e) =>
                          handleSettleUp(e, person.id, person.name)
                        }
                        className="text-[11px] font-semibold px-2 py-1 rounded-md border border-[var(--h)] bg-[var(--bg)] hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all"
                        title="Zero out and settle balance"
                      >
                        Settle Up
                      </button>
                    )}

                    {isOwed && (
                      <button
                        type="button"
                        onClick={(e) =>
                          handleSendReminder(
                            e,
                            person.name,
                            person.stats.netBalance,
                          )
                        }
                        className="p-1.5 text-[var(--m)] hover:text-blue-500 transition-colors"
                        title="Send friendly reminder"
                      >
                        <Send size={13} />
                      </button>
                    )}

                    <ChevronRight
                      size={14}
                      className="text-[var(--m)] group-hover:text-[var(--i)] transition-colors"
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
