// Modal to Add an Entry into the Debt Ledger: "I lent X", "I borrowed X", "They paid me back", "I paid back"
"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Percent,
  FileText,
  Camera,
  Upload,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { useExpenses } from "@/hook/expenses";
import type { DebtType } from "./types";

interface DebtEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPersonId?: string | null;
  defaultAction?: "lent" | "borrowed" | "they_paid" | "i_paid";
}

export function DebtEntryModal({
  isOpen,
  onClose,
  preselectedPersonId,
  defaultAction = "lent",
}: DebtEntryModalProps) {
  const {
    people,
    addPerson,
    addDebtEntry,
    addDebtRepayment,
    debtEntries,
    currency,
  } = useExpenses();

  const [mode, setMode] = useState<
    "lent" | "borrowed" | "they_paid" | "i_paid"
  >(defaultAction);
  const eligiblePeople = people.filter((p) => p.id !== "p_you");
  const [personId, setPersonId] = useState<string>(
    preselectedPersonId || eligiblePeople[0]?.id || "",
  );
  const [newPersonName, setNewPersonName] = useState("");
  const [isAddingNewPerson, setIsAddingNewPerson] = useState(false);

  // Sync state when modal opens or preselectedPersonId / defaultAction / people change
  useEffect(() => {
    if (isOpen) {
      setMode(defaultAction);
      const availablePeople = people.filter((p) => p.id !== "p_you");
      if (
        preselectedPersonId &&
        availablePeople.some((p) => p.id === preselectedPersonId)
      ) {
        setPersonId(preselectedPersonId);
        setIsAddingNewPerson(false);
      } else if (!personId || !availablePeople.some((p) => p.id === personId)) {
        if (availablePeople.length > 0 && availablePeople[0]) {
          setPersonId(availablePeople[0].id);
          setIsAddingNewPerson(false);
        } else {
          setPersonId("");
          setIsAddingNewPerson(true);
        }
      }
    }
  }, [isOpen, preselectedPersonId, defaultAction, people]);

  const [amount, setAmount] = useState<string>("");
  const [interestRate, setInterestRate] = useState<string>("0");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [proofUrl, setProofUrl] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    let targetPersonId = personId;
    if (isAddingNewPerson || !targetPersonId) {
      if (!newPersonName.trim()) {
        alert(
          eligiblePeople.length === 0
            ? "Please enter person's name to record debt"
            : "Please select or enter a person",
        );
        return;
      }
      targetPersonId = await addPerson({ name: newPersonName.trim() });
    }

    if (!targetPersonId) {
      alert("Please select or add a person");
      return;
    }

    if (mode === "lent" || mode === "borrowed") {
      // Create new debt entry
      addDebtEntry({
        personId: targetPersonId,
        type: mode as DebtType,
        principalAmount: parsedAmount,
        interestRateAnnual: parseFloat(interestRate) || 0,
        startDate,
        dueDate: dueDate || undefined,
        note: note.trim() || undefined,
        proofUrl: proofUrl.trim() || undefined,
      });
    } else {
      // Repayment entry ("they paid me back" or "I paid back")
      // Find open debt entries for this person
      const matchingType: DebtType = mode === "they_paid" ? "lent" : "borrowed";
      const openEntries = debtEntries.filter(
        (d) =>
          d.personId === targetPersonId &&
          d.type === matchingType &&
          !d.isSettled,
      );

      if (openEntries.length > 0) {
        // Apply repayment to the earliest open entry
        const targetEntry = openEntries[0];
        if (targetEntry) {
          addDebtRepayment(targetEntry.id, {
            entryDate: startDate,
            amount: parsedAmount,
            note:
              note.trim() ||
              (mode === "they_paid" ? "They paid back" : "I paid back"),
            proofUrl: proofUrl.trim() || undefined,
          });
        }
      } else {
        // If no matching open entry exists, create a reverse entry or notification
        addDebtEntry({
          personId: targetPersonId,
          type: mode === "they_paid" ? "borrowed" : "lent",
          principalAmount: parsedAmount,
          startDate,
          note:
            note.trim() ||
            (mode === "they_paid"
              ? "Advance payment received"
              : "Advance payment made"),
          proofUrl: proofUrl.trim() || undefined,
        });
      }
    }

    onClose();
    // Reset form
    setAmount("");
    setNote("");
    setProofUrl("");
    setDueDate("");
    setIsAddingNewPerson(false);
    setNewPersonName("");
  };

  const handleSimulateProof = () => {
    const proofs = [
      "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1554415707-9e49fe83083f?w=600&auto=format&fit=crop&q=60",
    ];
    setProofUrl(proofs[Math.floor(Math.random() * proofs.length)] || "");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-[var(--bg)] border border-[var(--h)] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--h)] bg-[var(--s)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">
              IOU
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--i)] tracking-tight">
                Record Debt / Loan Entry
              </h2>
              <p className="text-xs text-[var(--m)]">
                Track money lent, borrowed, or repayments
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ib w-8 h-8 flex items-center justify-center text-[var(--m)] hover:text-[var(--i)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 styled-scrollbar"
        >
          {/* Action Selection Matrix: 4 choices */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("lent")}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                mode === "lent"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 font-semibold"
                  : "border-[var(--h)] bg-[var(--surface-card)] text-[var(--b)] hover:border-[var(--m)]"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs">
                <ArrowUpRight size={14} />
                <span>I lent money</span>
              </div>
              <span className="text-[10px] text-[var(--m)]">They owe you</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("borrowed")}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                mode === "borrowed"
                  ? "border-amber-500 bg-amber-500/10 text-amber-500 font-semibold"
                  : "border-[var(--h)] bg-[var(--surface-card)] text-[var(--b)] hover:border-[var(--m)]"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs">
                <ArrowDownLeft size={14} />
                <span>I borrowed money</span>
              </div>
              <span className="text-[10px] text-[var(--m)]">You owe them</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("they_paid")}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                mode === "they_paid"
                  ? "border-blue-500 bg-blue-500/10 text-blue-500 font-semibold"
                  : "border-[var(--h)] bg-[var(--surface-card)] text-[var(--b)] hover:border-[var(--m)]"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs">
                <UserCheck size={14} />
                <span>They paid me back</span>
              </div>
              <span className="text-[10px] text-[var(--m)]">
                Decreases what they owe
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMode("i_paid")}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                mode === "i_paid"
                  ? "border-purple-500 bg-purple-500/10 text-purple-500 font-semibold"
                  : "border-[var(--h)] bg-[var(--surface-card)] text-[var(--b)] hover:border-[var(--m)]"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs">
                <UserCheck size={14} />
                <span>I paid them back</span>
              </div>
              <span className="text-[10px] text-[var(--m)]">
                Decreases what you owe
              </span>
            </button>
          </div>

          {/* Person Selector */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--b)]">
                Person
              </label>
              <button
                type="button"
                onClick={() => setIsAddingNewPerson(!isAddingNewPerson)}
                className="text-[11px] font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1"
              >
                {isAddingNewPerson
                  ? "Select Existing Person"
                  : "+ Add New Person"}
              </button>
            </div>

            {isAddingNewPerson || eligiblePeople.length === 0 ? (
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  required
                  placeholder="Enter person's name (e.g. Alex Rivera)"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  className="px-3 py-2 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-xs font-medium text-[var(--i)] focus:outline-hidden focus:border-[var(--i)]"
                />
                {eligiblePeople.length === 0 && (
                  <span className="text-[10px] text-[var(--m)]">
                    No contacts recorded yet. Adding a name will automatically
                    register them.
                  </span>
                )}
              </div>
            ) : (
              <select
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                className="px-3 py-2 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-xs font-medium text-[var(--i)] cursor-pointer"
              >
                {eligiblePeople.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.phone ? `(${p.phone})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--b)]">
              Amount
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-lg font-bold text-[var(--m)]">
                {currency === "INR" ? "₹" : "$"}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-lg font-semibold text-[var(--i)] focus:outline-hidden focus:border-[var(--i)]"
              />
            </div>
          </div>

          {/* Dates & Interest Rate Row */}
          {(mode === "lent" || mode === "borrowed") && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--b)]">
                  Entry Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-xs text-[var(--i)]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--b)]">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-xs text-[var(--i)]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[var(--b)]">
                  Annual Interest %
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full pl-2.5 pr-6 py-1.5 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-xs font-semibold text-[var(--i)]"
                  />
                  <Percent
                    size={12}
                    className="absolute right-2 text-[var(--m)]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Note Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--b)]">
              Note / Purpose
            </label>
            <input
              type="text"
              placeholder="e.g. Concert tickets, emergency repair, weekend loan"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-xs text-[var(--i)] placeholder:text-[var(--m)]"
            />
          </div>

          {/* Proof Screenshot / Attachment */}
          <div className="flex flex-col gap-2 p-3 rounded-xl border border-dashed border-[var(--h)] bg-[var(--s)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--b)] flex items-center gap-1.5">
                <Camera size={14} className="text-[var(--m)]" />
                Transfer Proof / Screenshot (Optional)
              </span>
              <button
                type="button"
                onClick={handleSimulateProof}
                className="text-xs font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1"
              >
                <Upload size={12} />
                Attach Mock Proof
              </button>
            </div>
            {proofUrl && (
              <div className="flex items-center gap-3 mt-1">
                <img
                  src={proofUrl}
                  alt="Proof Preview"
                  className="w-12 h-12 object-cover rounded-lg border border-[var(--h)]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--i)] truncate">
                    transfer-proof-snapshot.jpg
                  </p>
                  <button
                    type="button"
                    onClick={() => setProofUrl("")}
                    className="text-[11px] text-rose-500 hover:underline mt-0.5"
                  >
                    Remove proof
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[var(--h)]">
            <button
              type="button"
              onClick={onClose}
              className="bt text-xs font-medium px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bt p text-xs font-semibold px-5 py-2 flex items-center gap-1.5"
            >
              <Plus size={14} />
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
