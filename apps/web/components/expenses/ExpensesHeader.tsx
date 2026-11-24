// Redesigned Header for Personal Expenses & Debt Ledger Workspace
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Plus,
  Divide,
  Scale,
  Landmark,
  PieChart,
  Globe,
  Receipt,
  Users,
  FolderPlus,
  Tag,
  ArrowLeft,
  Settings,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useUIStore } from "@/store/uiStore";
import { useExpenses } from "@/hook/expenses";
import {
  useExpenseStore,
  type ExpensesWorkspaceTab,
} from "@/store/expenseStore";
import { CURRENCIES } from "@/lib/expenseUtils";
import type { CurrencyCode } from "./types";

interface ExpensesHeaderProps {
  onOpenAddTransaction: () => void;
  onOpenAddDebt: () => void;
  onOpenSplitBill: () => void;
  onOpenManageAccounts: () => void;
  onOpenManagePeople: () => void;
  onOpenCreateGroup: () => void;
  onOpenManageCategories: () => void;
}

export function ExpensesHeader({
  onOpenAddTransaction,
  onOpenAddDebt,
  onOpenSplitBill,
  onOpenManageAccounts,
  onOpenManagePeople,
  onOpenCreateGroup,
  onOpenManageCategories,
}: ExpensesHeaderProps) {
  const router = useRouter();
  const { darkMode, toggleTheme } = useUIStore();
  const { currency, setCurrency } = useExpenses();
  const { activeTab, setActiveTab, selectedMonth, setSelectedMonth } =
    useExpenseStore();

  const tabs: Array<{
    id: ExpensesWorkspaceTab;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "overview",
      label: "Overview & Analytics",
      icon: <PieChart size={14} />,
    },
    { id: "debts", label: "Debt Ledger (IOU)", icon: <Scale size={14} /> },
    { id: "expenses", label: "Expenses & Income", icon: <Receipt size={14} /> },
    { id: "splits", label: "Split & Groups", icon: <Divide size={14} /> },
  ];

  return (
    <header className="flex flex-col gap-5 bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 shadow-xs">
      {/* Top Bar: Back to AI Assistant, Branding, and Global Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--h)]">
        {/* Left: Back button & Title */}
        <div className="flex items-center gap-3">
          {/* Back to AI Assistant Chat Button (replaces route to /) */}
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="w-9 h-9 rounded-xl bg-[var(--s)] border border-[var(--h)] flex items-center justify-center text-[var(--m)] hover:text-[var(--i)] hover:border-[var(--m)] transition-all shrink-0 shadow-2xs"
            title="Back to AI Assistant"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Wallet size={20} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--i)]">
                Expenses & Debt Ledger
              </h1>
            </div>
            <p className="text-xs text-[var(--m)]">
              Cash flow, IOU debt settlements, split bills, and group expenses
            </p>
          </div>
        </div>

        {/* Right: Currency, Month Picker, and Theme Toggle */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Currency Selector */}
          <div className="relative flex items-center">
            <Globe
              size={13}
              className="absolute left-2.5 text-[var(--m)] pointer-events-none"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="pl-7 pr-3 py-1.5 bg-[var(--bg)] border border-[var(--h)] rounded-lg text-xs font-semibold text-[var(--i)] cursor-pointer appearance-none hover:border-[var(--m)] transition-colors"
              title="Select Currency"
            >
              {Object.entries(CURRENCIES).map(([code, config]) => (
                <option key={code} value={code}>
                  {config.symbol} {code}
                </option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-2.5 py-1.5 bg-[var(--bg)] border border-[var(--h)] rounded-lg text-xs font-semibold text-[var(--i)] hover:border-[var(--m)] transition-colors cursor-pointer"
            title="Filter Month"
          />

          {/* Theme Toggle */}
          <ThemeToggle
            darkMode={darkMode}
            onToggle={toggleTheme}
            className="w-8 h-8 rounded-lg border border-[var(--h)] bg-[var(--bg)] flex items-center justify-center text-[var(--m)] hover:text-[var(--i)]"
          />
        </div>
      </div>

      {/* Middle Row: Quick Management Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
        <div className="flex items-center flex-wrap gap-2">
          {/* Edit / Manage Categories */}
          <button
            type="button"
            onClick={onOpenManageCategories}
            className="bt text-xs font-medium px-3 py-1.5 flex items-center gap-1.5 text-[var(--i)] bg-[var(--s)] hover:bg-[var(--h)] border border-[var(--h)] rounded-lg transition-colors"
            title="Add and Edit Categories"
          >
            <Tag size={13} className="text-violet-500" />
            <span>Categories</span>
          </button>

          {/* Manage Accounts (Add or Delete) */}
          <button
            type="button"
            onClick={onOpenManageAccounts}
            className="bt text-xs font-medium px-3 py-1.5 flex items-center gap-1.5 text-[var(--i)] bg-[var(--s)] hover:bg-[var(--h)] border border-[var(--h)] rounded-lg transition-colors"
            title="Manage Payment Accounts & Budgets"
          >
            <Landmark size={13} className="text-blue-500" />
            <span>Accounts & Budgets</span>
          </button>

          {/* Manage People (Add or Delete) */}
          <button
            type="button"
            onClick={onOpenManagePeople}
            className="bt text-xs font-medium px-3 py-1.5 flex items-center gap-1.5 text-[var(--i)] bg-[var(--s)] hover:bg-[var(--h)] border border-[var(--h)] rounded-lg transition-colors"
            title="Add or Delete People"
          >
            <Users size={13} className="text-amber-500" />
            <span>People</span>
          </button>

          {/* Create Group */}
          <button
            type="button"
            onClick={onOpenCreateGroup}
            className="bt text-xs font-medium px-3 py-1.5 flex items-center gap-1.5 text-[var(--i)] bg-[var(--s)] hover:bg-[var(--h)] border border-[var(--h)] rounded-lg transition-colors"
            title="Create an Expense Group"
          >
            <FolderPlus size={13} className="text-emerald-500" />
            <span>Create Group</span>
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddTransaction}
            className="bt p text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={13} />
            <span>Transaction</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddDebt}
            className="bt text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 text-[var(--i)] bg-[var(--s)] hover:bg-[var(--h)] border border-[var(--h)] rounded-lg"
          >
            <Scale size={13} className="text-emerald-500" />
            <span className="hidden sm:inline">Record Debt</span>
          </button>

          <button
            type="button"
            onClick={onOpenSplitBill}
            className="bt text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 text-[var(--i)] bg-[var(--s)] hover:bg-[var(--h)] border border-[var(--h)] rounded-lg"
          >
            <Divide size={13} className="text-blue-500" />
            <span className="hidden sm:inline">Split Bill</span>
          </button>
        </div>
      </div>

      {/* Bottom Tabs: Navigation Pill Bar */}
      <div className="flex border-t border-[var(--h)] pt-3">
        <div className="nav-pill-group p-1 flex overflow-x-auto styled-scrollbar w-full sm:w-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full transition-all shrink-0 ${
                  isActive
                    ? "bg-[var(--p)] text-[var(--pt)] shadow-2xs"
                    : "text-[var(--m)] hover:text-[var(--i)]"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
