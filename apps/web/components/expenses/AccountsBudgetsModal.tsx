// Accounts & Monthly Budgets Management Modal
"use client";

import { useState } from "react";
import {
  X,
  CreditCard,
  Plus,
  Trash2,
  PieChart,
  Wallet,
  Smartphone,
  Landmark,
} from "lucide-react";
import { useExpenses } from "@/hook/expenses";
import type { AccountType } from "./types";
import { formatCurrency } from "@/lib/expenseUtils";
import { CategoryIcon } from "./CategoryIcon";

interface AccountsBudgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "accounts" | "budgets";
}

export function AccountsBudgetsModal({
  isOpen,
  onClose,
  defaultTab = "accounts",
}: AccountsBudgetsModalProps) {
  const {
    accounts,
    addAccount,
    deleteAccount,
    categories,
    budgets,
    setBudget,
    selectedMonth,
    currency,
  } = useExpenses();

  const [activeSubTab, setActiveSubTab] = useState<"accounts" | "budgets">(
    defaultTab,
  );

  // New account form state
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("bank");
  const [initialBalance, setInitialBalance] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  if (!isOpen) return null;

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) return;
    const balance = parseFloat(initialBalance) || 0;
    const color =
      accountType === "bank"
        ? "#3b82f6"
        : accountType === "upi"
          ? "#10b981"
          : "#f59e0b";

    addAccount({
      name: accountName.trim(),
      type: accountType,
      balance,
      accountNumber: accountNumber.trim() || undefined,
      color,
    });

    setAccountName("");
    setInitialBalance("");
    setAccountNumber("");
  };

  const expenseCategories = categories.filter((c) => c.type === "expense");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl bg-[var(--bg)] border border-[var(--h)] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--h)] bg-[var(--s)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--i)] tracking-tight">
                Accounts & Budgets
              </h2>
              <p className="text-xs text-[var(--m)]">
                Manage bank accounts, UPI, cash, and spending caps
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

        {/* Sub Tabs */}
        <div className="flex border-b border-[var(--h)] px-6 pt-2 bg-[var(--s)]">
          <button
            type="button"
            onClick={() => setActiveSubTab("accounts")}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === "accounts"
                ? "border-[var(--p)] text-[var(--i)]"
                : "border-transparent text-[var(--m)] hover:text-[var(--i)]"
            }`}
          >
            <Landmark size={14} />
            Payment Accounts ({accounts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("budgets")}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === "budgets"
                ? "border-[var(--p)] text-[var(--i)]"
                : "border-transparent text-[var(--m)] hover:text-[var(--i)]"
            }`}
          >
            <PieChart size={14} />
            Monthly Budgets ({selectedMonth})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 styled-scrollbar">
          {activeSubTab === "accounts" ? (
            <div className="flex flex-col gap-6">
              {/* Account List */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">
                  Configured Accounts ({accounts.length})
                </span>
                <div className="flex flex-col gap-2">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-[var(--h)] bg-[var(--surface-card)]"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: `${acc.color}20`,
                            color: acc.color,
                          }}
                        >
                          {acc.type === "bank" ? (
                            <Landmark size={18} />
                          ) : acc.type === "upi" ? (
                            <Smartphone size={18} />
                          ) : (
                            <Wallet size={18} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[var(--i)]">
                              {acc.name}
                            </span>
                            <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-[var(--s)] text-[var(--m)] border border-[var(--h)]">
                              {acc.type}
                            </span>
                          </div>
                          {acc.accountNumber && (
                            <p className="text-[11px] text-[var(--m)]">
                              {acc.accountNumber}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-[var(--i)]">
                          {formatCurrency(acc.balance, currency)}
                        </span>
                        {accounts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => deleteAccount(acc.id)}
                            className="text-[var(--m)] hover:text-rose-500 p-1.5 rounded-md hover:bg-rose-500/10 transition-colors"
                            title="Delete account"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Account Form */}
              <form
                onSubmit={handleAddAccount}
                className="flex flex-col gap-3 p-4 rounded-xl border border-[var(--h)] bg-[var(--s)]"
              >
                <span className="text-xs font-semibold text-[var(--i)]">
                  Add New Account
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[var(--b)] font-medium">
                      Account Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chase Checking"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--h)] rounded-lg text-xs text-[var(--i)]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[var(--b)] font-medium">
                      Account Type
                    </label>
                    <select
                      value={accountType}
                      onChange={(e) =>
                        setAccountType(e.target.value as AccountType)
                      }
                      className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--h)] rounded-lg text-xs text-[var(--i)]"
                    >
                      <option value="bank">Bank Account</option>
                      <option value="upi">UPI / Instant Pay</option>
                      <option value="cash">Cash in Hand</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[var(--b)] font-medium">
                      Starting Balance
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={initialBalance}
                      onChange={(e) => setInitialBalance(e.target.value)}
                      className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--h)] rounded-lg text-xs text-[var(--i)]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[var(--b)] font-medium">
                      Account Ref / ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. •••• 9821 or vpa@upi"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--h)] rounded-lg text-xs text-[var(--i)]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bt p text-xs font-semibold py-1.5 self-end flex items-center gap-1 mt-1"
                >
                  <Plus size={13} />
                  Add Account
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--i)]">
                  Monthly Budget Caps ({selectedMonth})
                </span>
                <span className="text-[11px] text-[var(--m)]">
                  Set target maximum spending per category
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {expenseCategories.map((cat) => {
                  const currentBudget = budgets.find(
                    (b) => b.categoryId === cat.id && b.month === selectedMonth,
                  );
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-[var(--h)] bg-[var(--surface-card)]"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: `${cat.color}20`,
                            color: cat.color,
                          }}
                        >
                          <CategoryIcon icon={cat.icon} size={14} />
                        </div>
                        <span className="text-xs font-medium text-[var(--i)]">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--m)] font-semibold">
                          $
                        </span>
                        <input
                          type="number"
                          placeholder="No limit"
                          defaultValue={
                            currentBudget ? currentBudget.amount : ""
                          }
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            setBudget(
                              cat.id,
                              selectedMonth,
                              isNaN(val) ? 0 : val,
                            );
                          }}
                          className="w-24 px-2 py-1 bg-[var(--bg)] border border-[var(--h)] rounded-md text-xs font-semibold text-right text-[var(--i)]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--h)] bg-[var(--s)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bt p text-xs font-semibold px-4 py-1.5"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
