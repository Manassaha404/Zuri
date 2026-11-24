// Per-Person History Timeline & Partial Repayments Inspector
"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Percent,
  Receipt,
  Trash2,
  X,
  CreditCard,
} from "lucide-react";
import { useExpenses } from "@/hook/expenses";
import {
  calculateDebtInterest,
  calculateEntryBalance,
  calculatePersonNetBalance,
  formatCurrency,
} from "@/lib/expenseUtils";
import type { DebtEntry } from "./types";

interface PersonDebtTimelineProps {
  personId: string;
  onClose: () => void;
  onOpenAddModal: (
    defaultAction?: "they_paid" | "i_paid" | "lent" | "borrowed",
  ) => void;
}

export function PersonDebtTimeline({
  personId,
  onClose,
  onOpenAddModal,
}: PersonDebtTimelineProps) {
  const {
    people,
    debtEntries,
    currency,
    addDebtRepayment,
    deleteDebtEntry,
    settlePersonDebts,
  } = useExpenses();

  const [activeRepayModalEntry, setActiveRepayModalEntry] =
    useState<DebtEntry | null>(null);
  const [repayAmount, setRepayAmount] = useState<string>("");
  const [repayNote, setRepayNote] = useState<string>("");
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  const person = people.find((p) => p.id === personId);

  // Filter entries for this person, sorted latest first
  const entries = useMemo(() => {
    return debtEntries
      .filter((d) => d.personId === personId)
      .sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
      );
  }, [debtEntries, personId]);

  const personStats = useMemo(() => {
    return calculatePersonNetBalance(personId, debtEntries);
  }, [personId, debtEntries]);

  if (!person) return null;

  const handleAddPartialRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRepayModalEntry) return;
    const parsed = parseFloat(repayAmount);
    if (isNaN(parsed) || parsed <= 0) {
      alert("Please enter a valid repayment amount");
      return;
    }

    addDebtRepayment(activeRepayModalEntry.id, {
      entryDate: new Date().toISOString().slice(0, 10),
      amount: parsed,
      note: repayNote.trim() || undefined,
    });

    setActiveRepayModalEntry(null);
    setRepayAmount("");
    setRepayNote("");
  };

  return (
    <div className="flex flex-col gap-5 p-5 rounded-2xl border border-[var(--h)] bg-[var(--surface-card)]">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--h)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 font-bold text-sm flex items-center justify-center border border-blue-500/20">
            {person.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--i)] tracking-tight">
              {person.name}
            </h3>
            <p className="text-xs text-[var(--m)]">
              {person.email || person.phone || "Transaction Ledger"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {Math.abs(personStats.netBalance) > 0.01 && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Zero out balance with ${person.name}?`)) {
                  settlePersonDebts(person.id);
                }
              }}
              className="bt p text-xs font-semibold px-3 py-1.5"
            >
              Settle Balance
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ib w-8 h-8 flex items-center justify-center text-[var(--m)] hover:text-[var(--i)]"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Net Position Summary Box */}
      <div className="p-4 rounded-xl border border-[var(--h)] bg-[var(--bg)] flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-[var(--m)]">
            Net Standing
          </span>
          <h4
            className={`text-lg font-bold ${
              personStats.netBalance > 0
                ? "text-emerald-500"
                : personStats.netBalance < 0
                  ? "text-rose-500"
                  : "text-[var(--i)]"
            }`}
          >
            {personStats.netBalance > 0 ? "+" : ""}
            {formatCurrency(personStats.netBalance, currency)}
          </h4>
          <span className="text-[11px] text-[var(--m)]">
            {personStats.netBalance > 0
              ? `${person.name} owes you`
              : personStats.netBalance < 0
                ? `You owe ${person.name}`
                : "All settled up clean"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenAddModal("lent")}
            className="bt text-xs font-semibold px-3 py-1.5 flex items-center gap-1"
          >
            <Plus size={13} />
            Lend
          </button>
          <button
            type="button"
            onClick={() => onOpenAddModal("they_paid")}
            className="bt text-xs font-semibold px-3 py-1.5 flex items-center gap-1"
          >
            <CreditCard size={13} />
            Record Repayment
          </button>
        </div>
      </div>

      {/* Per-Person History Timeline */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">
          Timeline History
        </span>

        {entries.length === 0 ? (
          <div className="p-8 text-center border border-[var(--h)] rounded-xl bg-[var(--bg)]">
            <p className="text-xs text-[var(--m)]">
              No debt or loan history recorded with this person yet
            </p>
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-[var(--h)] flex flex-col gap-6">
            {entries.map((entry) => {
              const remaining = calculateEntryBalance(entry);
              const interest = calculateDebtInterest(entry);
              const isLent = entry.type === "lent";
              const isOverdue =
                !entry.isSettled &&
                entry.dueDate &&
                entry.dueDate < new Date().toISOString().slice(0, 10);

              return (
                <div key={entry.id} className="relative flex flex-col gap-2">
                  {/* Timeline indicator node */}
                  <div
                    className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-[var(--bg)] flex items-center justify-center ${
                      entry.isSettled
                        ? "bg-emerald-500"
                        : isOverdue
                          ? "bg-rose-500 animate-pulse"
                          : isLent
                            ? "bg-blue-500"
                            : "bg-amber-500"
                    }`}
                  />

                  {/* Card Container */}
                  <div className="p-4 rounded-xl border border-[var(--h)] bg-[var(--bg)] flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold uppercase px-2 py-0.5 rounded-md ${
                            isLent
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-rose-500/10 text-rose-500"
                          }`}
                        >
                          {isLent ? "You Lent" : "You Borrowed"}
                        </span>
                        {entry.isSettled && (
                          <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1">
                            <CheckCircle2 size={11} />
                            Fully Settled
                          </span>
                        )}
                        {isOverdue && (
                          <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-1">
                            <AlertCircle size={11} />
                            Overdue
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--i)]">
                          {formatCurrency(entry.principalAmount, currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteDebtEntry(entry.id)}
                          className="text-[var(--m)] hover:text-rose-500 p-1 transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Metadata: Date, Due Date, Interest, Notes */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-[var(--m)]">
                      <div>
                        <span>Date: </span>
                        <span className="text-[var(--i)] font-medium">
                          {entry.startDate}
                        </span>
                      </div>
                      {entry.dueDate && (
                        <div>
                          <span>Due: </span>
                          <span
                            className={`font-medium ${
                              isOverdue
                                ? "text-rose-500 font-bold"
                                : "text-[var(--i)]"
                            }`}
                          >
                            {entry.dueDate}
                          </span>
                        </div>
                      )}
                      {entry.interestRateAnnual &&
                      entry.interestRateAnnual > 0 ? (
                        <div>
                          <span>Interest: </span>
                          <span className="text-[var(--i)] font-medium">
                            {entry.interestRateAnnual}% (+
                            {formatCurrency(interest, currency)})
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {entry.note && (
                      <p className="text-xs text-[var(--b)] italic">
                        "{entry.note}"
                      </p>
                    )}

                    {/* Attached Proof if present */}
                    {entry.proofUrl && (
                      <button
                        type="button"
                        onClick={() => setSelectedProof(entry.proofUrl || null)}
                        className="self-start text-[11px] font-semibold text-blue-500 hover:underline flex items-center gap-1"
                      >
                        <Receipt size={12} />
                        View Proof Snapshot
                      </button>
                    )}

                    {/* Repayments Breakdown Section */}
                    <div className="pt-2 border-t border-[var(--h)] flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[var(--m)]">
                          Remaining Balance:{" "}
                          <strong className="text-[var(--i)]">
                            {formatCurrency(remaining, currency)}
                          </strong>
                        </span>
                        {!entry.isSettled && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveRepayModalEntry(entry);
                              setRepayAmount(remaining.toString());
                            }}
                            className="text-xs font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1"
                          >
                            <Plus size={12} />
                            Add Repayment
                          </button>
                        )}
                      </div>

                      {entry.repayments.length > 0 && (
                        <div className="flex flex-col gap-1.5 pl-3 border-l border-[var(--h)] mt-1">
                          {entry.repayments.map((rep) => (
                            <div
                              key={rep.id}
                              className="flex items-center justify-between text-[11px] text-[var(--m)]"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-emerald-500 font-semibold">
                                  ✓ Repaid{" "}
                                  {formatCurrency(rep.amount, currency)}
                                </span>
                                <span>({rep.entryDate})</span>
                                {rep.note && <span>• {rep.note}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Partial Repayment Modal */}
      {activeRepayModalEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-sm bg-[var(--bg)] border border-[var(--h)] rounded-2xl p-5 shadow-xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--h)] pb-2">
              <span className="text-xs font-bold text-[var(--i)]">
                Record Partial / Full Repayment
              </span>
              <button
                type="button"
                onClick={() => setActiveRepayModalEntry(null)}
                className="text-[var(--m)] hover:text-[var(--i)]"
              >
                <X size={15} />
              </button>
            </div>

            <form
              onSubmit={handleAddPartialRepayment}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--b)] font-medium">
                  Repayment Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="px-3 py-1.5 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-sm font-semibold text-[var(--i)]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--b)] font-medium">
                  Note / Payment Mode
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI transfer, Cash, Bank ref"
                  value={repayNote}
                  onChange={(e) => setRepayNote(e.target.value)}
                  className="px-3 py-1.5 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-xs text-[var(--i)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveRepayModalEntry(null)}
                  className="bt text-xs px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bt p text-xs font-semibold px-4 py-1.5"
                >
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proof Viewer Modal */}
      {selectedProof && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          onClick={() => setSelectedProof(null)}
        >
          <div
            className="max-w-md w-full bg-[var(--bg)] border border-[var(--h)] rounded-2xl p-4 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--h)] pb-2">
              <span className="text-xs font-semibold text-[var(--i)]">
                Transfer Proof Image
              </span>
              <button
                type="button"
                onClick={() => setSelectedProof(null)}
                className="text-xs text-[var(--m)] hover:text-[var(--i)]"
              >
                Close
              </button>
            </div>
            <img
              src={selectedProof}
              alt="Proof Preview"
              className="w-full max-h-80 object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
