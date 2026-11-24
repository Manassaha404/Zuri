// Modal to Split a Bill across multiple people (Equal, Exact, Percentage)
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Users,
  Divide,
  Percent,
  Check,
  CreditCard,
  User,
} from "lucide-react";
import { useExpenses } from "@/hook/expenses";
import type { BillSplitItem, SplitMethod } from "./types";
import { formatCurrency } from "@/lib/expenseUtils";

interface BillSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGroupId?: string | null;
}

export function BillSplitModal({
  isOpen,
  onClose,
  defaultGroupId,
}: BillSplitModalProps) {
  const { people, groups, addBillSplit, currency } = useExpenses();

  // Combine You with existing people so "You" is always an available option, filtering out any duplicate "You" records
  const allPeopleOptions = useMemo(() => {
    return [
      { id: "p_you", name: "You" },
      ...people.filter((p) => p.id !== "p_you" && p.name !== "You"),
    ];
  }, [people]);

  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paidByPersonId, setPaidByPersonId] = useState("p_you");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [groupId, setGroupId] = useState(defaultGroupId || "");
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("equal");

  // Selected participants (defaults to you + available contacts, or group members if groupId provided)
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([
    "p_you",
  ]);

  // Exact custom amounts or percentage map
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  // Active group selected in modal dropdown
  const currentGroup = useMemo(() => {
    return groupId ? groups.find((g) => g.id === groupId) : null;
  }, [groupId, groups]);

  // Options displayed in the modal: restricted to current group's members when a group is chosen
  const displayedPeopleOptions = useMemo(() => {
    if (currentGroup && currentGroup.memberIds.length > 0) {
      const memberSet = new Set(currentGroup.memberIds);
      return allPeopleOptions.filter((p) => memberSet.has(p.id));
    }
    return allPeopleOptions;
  }, [currentGroup, allPeopleOptions]);

  // When changing groups or opening modal, synchronize participant selection
  const syncGroupParticipants = (targetGroupId: string) => {
    const activeGroup = targetGroupId
      ? groups.find((g) => g.id === targetGroupId)
      : null;
    if (activeGroup && activeGroup.memberIds.length > 0) {
      // Deduplicate and normalize self ID
      const normalizedMembers = Array.from(
        new Set(
          activeGroup.memberIds.map((mId) => {
            const p = people.find((person) => person.id === mId);
            return p?.name === "You" ? "p_you" : mId;
          }),
        ),
      );
      setSelectedPersonIds(normalizedMembers);
      if (!normalizedMembers.includes(paidByPersonId)) {
        setPaidByPersonId(normalizedMembers[0] || "p_you");
      }
    } else {
      const allIds = [
        "p_you",
        ...people
          .filter((p) => p.id !== "p_you" && p.name !== "You")
          .map((p) => p.id),
      ];
      setSelectedPersonIds(allIds);
      setPaidByPersonId("p_you");
    }
  };

  // Synchronize defaults on open or when defaultGroupId changes
  useEffect(() => {
    if (isOpen) {
      const targetGroupId = defaultGroupId || "";
      setGroupId(targetGroupId);
      syncGroupParticipants(targetGroupId);
    }
  }, [isOpen, defaultGroupId]);

  if (!isOpen) return null;

  const togglePersonSelection = (id: string) => {
    if (selectedPersonIds.includes(id)) {
      if (selectedPersonIds.length <= 1) {
        alert("At least one participant required to split");
        return;
      }
      setSelectedPersonIds(selectedPersonIds.filter((p) => p !== id));
    } else {
      setSelectedPersonIds([...selectedPersonIds, id]);
    }
  };

  const parsedTotal = parseFloat(totalAmount) || 0;

  // Compute breakdown for preview
  const computedSplits: BillSplitItem[] = selectedPersonIds.map((pId) => {
    let amount = 0;
    let percentage = 0;

    if (splitMethod === "equal") {
      amount =
        selectedPersonIds.length > 0
          ? parsedTotal / selectedPersonIds.length
          : 0;
      percentage =
        selectedPersonIds.length > 0 ? 100 / selectedPersonIds.length : 0;
    } else if (splitMethod === "exact") {
      amount = parseFloat(customValues[pId] || "0") || 0;
      percentage = parsedTotal > 0 ? (amount / parsedTotal) * 100 : 0;
    } else if (splitMethod === "percentage") {
      percentage = parseFloat(customValues[pId] || "0") || 0;
      amount = (parsedTotal * percentage) / 100;
    }

    return {
      personId: pId,
      amount: Math.round(amount * 100) / 100,
      percentage: Math.round(percentage * 10) / 10,
      isPaid: pId === paidByPersonId,
    };
  });

  const sumComputed = computedSplits.reduce((s, c) => s + c.amount, 0);
  const diffFromTotal = Math.abs(sumComputed - parsedTotal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please provide a title");
      return;
    }
    if (parsedTotal <= 0) {
      alert("Please enter a valid total amount");
      return;
    }
    if (selectedPersonIds.length === 0) {
      alert("Select at least one participant");
      return;
    }

    if (splitMethod !== "equal" && diffFromTotal > 0.05) {
      if (
        !confirm(
          `Split breakdown sum (${sumComputed}) differs from total (${parsedTotal}). Continue anyway?`,
        )
      ) {
        return;
      }
    }

    addBillSplit({
      title: title.trim(),
      totalAmount: parsedTotal,
      paidByPersonId,
      date,
      splitMethod,
      splits: computedSplits,
      groupId: groupId || undefined,
    });

    onClose();
    // Reset form
    setTitle("");
    setTotalAmount("");
    setCustomValues({});
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
            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Divide size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--i)] tracking-tight">
                Split a Bill
              </h2>
              <p className="text-xs text-[var(--m)]">
                Divide dining, groceries, rent, or trip bills across contacts
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
          className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 styled-scrollbar"
        >
          {/* Bill Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--b)]">
              Bill Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dinner at Olive Garden, Airbnb Booking"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-3 py-2 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-xs font-medium text-[var(--i)] focus:outline-hidden focus:border-[var(--i)]"
            />
          </div>

          {/* Amount & Paid By Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--b)]">
                Total Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="px-3 py-2 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-sm font-bold text-[var(--i)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--b)]">
                Paid By
              </label>
              <select
                value={paidByPersonId}
                onChange={(e) => setPaidByPersonId(e.target.value)}
                className="px-3 py-2 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-xs font-medium text-[var(--i)] cursor-pointer"
              >
                {displayedPeopleOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.id === "p_you" ? "(You)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Group and Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--b)]">
                Group (Optional)
              </label>
              <select
                value={groupId}
                onChange={(e) => {
                  const newGId = e.target.value;
                  setGroupId(newGId);
                  syncGroupParticipants(newGId);
                }}
                className="px-3 py-2 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-xs text-[var(--i)] cursor-pointer"
              >
                <option value="">No Group (Individual split)</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--b)]">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-xs text-[var(--i)]"
              />
            </div>
          </div>

          {/* Split Method Segmented Tabs */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--b)]">
              Split Method
            </label>
            <div className="nav-pill-group p-1 flex">
              <button
                type="button"
                onClick={() => setSplitMethod("equal")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  splitMethod === "equal"
                    ? "bg-[var(--p)] text-[var(--pt)] shadow-2xs"
                    : "text-[var(--m)] hover:text-[var(--i)]"
                }`}
              >
                Split Equally (=)
              </button>
              <button
                type="button"
                onClick={() => setSplitMethod("exact")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  splitMethod === "exact"
                    ? "bg-[var(--p)] text-[var(--pt)] shadow-2xs"
                    : "text-[var(--m)] hover:text-[var(--i)]"
                }`}
              >
                Exact Amounts ($)
              </button>
              <button
                type="button"
                onClick={() => setSplitMethod("percentage")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  splitMethod === "percentage"
                    ? "bg-[var(--p)] text-[var(--pt)] shadow-2xs"
                    : "text-[var(--m)] hover:text-[var(--i)]"
                }`}
              >
                Percentages (%)
              </button>
            </div>
          </div>

          {/* Participant selection and custom inputs */}
          <div className="flex flex-col gap-2 p-3 rounded-xl border border-[var(--h)] bg-[var(--surface-card)]">
            <span className="text-xs font-semibold text-[var(--i)]">
              Participants & Shares ({selectedPersonIds.length})
            </span>

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto styled-scrollbar pr-1">
              {displayedPeopleOptions.map((person) => {
                const isSelected = selectedPersonIds.includes(person.id);
                const computed = computedSplits.find(
                  (s) => s.personId === person.id,
                );

                return (
                  <div
                    key={person.id}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                      isSelected
                        ? "border-[var(--h)] bg-[var(--bg)]"
                        : "border-transparent opacity-60 bg-transparent"
                    }`}
                  >
                    <div
                      className="flex items-center gap-2.5 cursor-pointer flex-1"
                      onClick={() => togglePersonSelection(person.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePersonSelection(person.id)}
                        className="rounded border-[var(--h)]"
                      />
                      <span className="text-xs font-medium text-[var(--i)]">
                        {person.name} {person.id === "p_you" ? "(You)" : ""}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-2">
                        {splitMethod === "equal" ? (
                          <span className="text-xs font-semibold text-[var(--i)]">
                            {formatCurrency(computed?.amount || 0, currency)}
                          </span>
                        ) : splitMethod === "exact" ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-[var(--m)]">$</span>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={customValues[person.id] || ""}
                              onChange={(e) =>
                                setCustomValues({
                                  ...customValues,
                                  [person.id]: e.target.value,
                                })
                              }
                              className="w-20 px-2 py-1 bg-[var(--surface-card)] border border-[var(--h)] rounded text-xs font-semibold text-right text-[var(--i)]"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.1"
                              placeholder="0"
                              value={customValues[person.id] || ""}
                              onChange={(e) =>
                                setCustomValues({
                                  ...customValues,
                                  [person.id]: e.target.value,
                                })
                              }
                              className="w-16 px-2 py-1 bg-[var(--surface-card)] border border-[var(--h)] rounded text-xs font-semibold text-right text-[var(--i)]"
                            />
                            <span className="text-xs text-[var(--m)]">%</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
              Save Split Bill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
