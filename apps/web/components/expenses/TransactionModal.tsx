// Modal to add an expense or income transaction
"use client";

import { useState } from "react";
import {
  X,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CreditCard,
  FileText,
  Camera,
  Repeat,
  Upload,
} from "lucide-react";
import { useExpenses } from "@/hook/expenses";
import type {
  AccountType,
  RecurrenceFrequency,
  TransactionType,
} from "./types";
import { CategoryIcon } from "./CategoryIcon";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

export function TransactionModal({
  isOpen,
  onClose,
  defaultType = "expense",
}: TransactionModalProps) {
  const { categories, accounts, addTransaction, currency } = useExpenses();

  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [note, setNote] = useState<string>("");
  const [receiptUrl, setReceiptUrl] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurrenceFrequency, setRecurrenceFrequency] =
    useState<RecurrenceFrequency>("monthly");

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === type);

  // Set default category if not selected or mismatched
  const currentCategory =
    filteredCategories.find((c) => c.id === categoryId) ||
    filteredCategories[0];

  // Resolve current selected account or fallback to first available account
  const currentAccountId =
    accountId && accounts.some((a) => a.id === accountId)
      ? accountId
      : accounts[0]?.id || "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid positive amount");
      return;
    }
    const targetCategoryId = categoryId || currentCategory?.id || "";
    if (!targetCategoryId) {
      alert("Please select a category");
      return;
    }
    const targetAccountId = currentAccountId;
    if (!targetAccountId) {
      alert("Please create or select an account first");
      return;
    }

    addTransaction({
      type,
      amount: parsedAmount,
      categoryId: targetCategoryId,
      accountId: targetAccountId,
      date,
      note: note.trim() || undefined,
      receiptUrl: receiptUrl.trim() || undefined,
      isRecurring,
      recurrenceFrequency: isRecurring ? recurrenceFrequency : "none",
    });

    onClose();
    // Reset form
    setAmount("");
    setNote("");
    setReceiptUrl("");
    setIsRecurring(false);
  };

  const handleSimulatePhotoUpload = () => {
    // Provide a realistic sample receipt image for mock demonstration
    const sampleReceipts = [
      "https://images.unsplash.com/photo-1554415707-9e49fe83083f?w=600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=60",
    ];
    const picked =
      sampleReceipts[Math.floor(Math.random() * sampleReceipts.length)];
    setReceiptUrl(picked || "");
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
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                type === "expense"
                  ? "bg-rose-500/10 text-rose-500"
                  : "bg-emerald-500/10 text-emerald-500"
              }`}
            >
              {type === "expense" ? (
                <ArrowDownLeft size={16} />
              ) : (
                <ArrowUpRight size={16} />
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--i)] tracking-tight">
                Add {type === "expense" ? "Expense" : "Income"}
              </h2>
              <p className="text-xs text-[var(--m)]">
                Record personal cash flow and receipts
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
          {/* Transaction Type Segmented Toggle */}
          <div className="nav-pill-group p-1 flex">
            <button
              type="button"
              onClick={() => {
                setType("expense");
                setCategoryId("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-full transition-all ${
                type === "expense"
                  ? "bg-rose-500 text-white shadow-2xs"
                  : "text-[var(--m)] hover:text-[var(--i)]"
              }`}
            >
              <ArrowDownLeft size={14} />
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType("income");
                setCategoryId("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-full transition-all ${
                type === "income"
                  ? "bg-emerald-500 text-white shadow-2xs"
                  : "text-[var(--m)] hover:text-[var(--i)]"
              }`}
            >
              <ArrowUpRight size={14} />
              Income
            </button>
          </div>

          {/* Amount Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--b)]">
              Amount
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-lg font-bold text-[var(--m)]">
                {currency === "INR"
                  ? "₹"
                  : currency === "EUR"
                    ? "€"
                    : currency === "GBP"
                      ? "£"
                      : "$"}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-4 py-2.5 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-lg font-semibold text-[var(--i)] placeholder:text-[var(--m)] focus:outline-hidden focus:border-[var(--i)]"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--b)]">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 border border-[var(--h)] rounded-lg styled-scrollbar bg-[var(--surface-card)]">
              {filteredCategories.map((cat) => {
                const isSelected =
                  (categoryId || currentCategory?.id) === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-2 p-2 rounded-md text-xs font-medium transition-all text-left ${
                      isSelected
                        ? "bg-[var(--p)] text-[var(--pt)]"
                        : "text-[var(--b)] hover:bg-[var(--s)]"
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: isSelected
                          ? "rgba(255,255,255,0.2)"
                          : `${cat.color}20`,
                        color: isSelected ? "currentColor" : cat.color,
                      }}
                    >
                      <CategoryIcon icon={cat.icon} size={12} />
                    </div>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account & Date Selection Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--b)]">
                Account
              </label>
              <div className="relative">
                <select
                  value={currentAccountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-xs font-medium text-[var(--i)] appearance-none focus:outline-hidden focus:border-[var(--i)] cursor-pointer"
                >
                  {accounts.length === 0 ? (
                    <option value="">No accounts found</option>
                  ) : (
                    accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type.toUpperCase()})
                      </option>
                    ))
                  )}
                </select>
                <CreditCard
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--m)]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--b)]">
                Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-xs font-medium text-[var(--i)] focus:outline-hidden focus:border-[var(--i)]"
                />
              </div>
            </div>
          </div>

          {/* Note Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--b)]">
              Note / Description
            </label>
            <input
              type="text"
              placeholder="e.g. Dinner with team, groceries, flight booking"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-xs font-medium text-[var(--i)] placeholder:text-[var(--m)] focus:outline-hidden focus:border-[var(--i)]"
            />
          </div>

          {/* Receipt Photo / Attachment */}
          <div className="flex flex-col gap-2 p-3 rounded-xl border border-dashed border-[var(--h)] bg-[var(--s)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--b)] flex items-center gap-1.5">
                <Camera size={14} className="text-[var(--m)]" />
                Receipt Photo / Proof
              </span>
              <button
                type="button"
                onClick={handleSimulatePhotoUpload}
                className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                <Upload size={12} />
                Attach Mock Photo
              </button>
            </div>
            {receiptUrl ? (
              <div className="flex items-center gap-3 mt-1">
                <img
                  src={receiptUrl}
                  alt="Receipt Preview"
                  className="w-12 h-12 object-cover rounded-lg border border-[var(--h)]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--i)] truncate">
                    receipt-snapshot.jpg
                  </p>
                  <button
                    type="button"
                    onClick={() => setReceiptUrl("")}
                    className="text-[11px] text-rose-500 hover:underline mt-0.5"
                  >
                    Remove attachment
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[var(--m)]">
                Attach receipt screenshot or invoice photo for proof
              </p>
            )}
          </div>

          {/* Recurring Transaction Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--h)] bg-[var(--surface-card)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--s)] flex items-center justify-center text-[var(--m)]">
                <Repeat size={15} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--i)]">
                  Recurring Transaction
                </p>
                <p className="text-[11px] text-[var(--m)]">
                  Auto-repeat monthly rent, subscriptions, salary
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[var(--h)] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--p)]" />
            </label>
          </div>

          {/* Recurring Frequency selector */}
          {isRecurring && (
            <div className="flex flex-col gap-1.5 pl-4 border-l-2 border-[var(--accent)]">
              <label className="text-xs font-medium text-[var(--b)]">
                Repeat Interval
              </label>
              <select
                value={recurrenceFrequency}
                onChange={(e) =>
                  setRecurrenceFrequency(e.target.value as RecurrenceFrequency)
                }
                className="w-full px-3 py-2 bg-[var(--surface-card)] border border-[var(--h)] rounded-lg text-xs font-medium text-[var(--i)] cursor-pointer"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}

          {/* Modal Footer Actions */}
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
              Save Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
