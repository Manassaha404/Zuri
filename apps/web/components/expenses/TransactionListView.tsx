// Transaction list, recurring items badge, search and filters
"use client";

import { useState, useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  Calendar,
  Repeat,
  Trash2,
  Receipt,
  Eye,
} from "lucide-react";
import { useExpenses } from "@/hook/expenses";
import { useExpenseStore } from "@/store/expenseStore";
import { formatCurrency } from "@/lib/expenseUtils";
import { CategoryIcon } from "./CategoryIcon";
import type { TransactionType } from "./types";

interface TransactionListViewProps {
  onOpenAddModal: () => void;
}

export function TransactionListView({
  onOpenAddModal,
}: TransactionListViewProps) {
  const { transactions, categories, accounts, deleteTransaction, currency } =
    useExpenses();
  const { selectedMonth } = useExpenseStore();

  const [filterType, setFilterType] = useState<"all" | TransactionType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterType !== "all" && tx.type !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cat = categories.find((c) => c.id === tx.categoryId);
        const acc = accounts.find((a) => a.id === tx.accountId);
        const matchNote = tx.note?.toLowerCase().includes(q);
        const matchCat = cat?.name.toLowerCase().includes(q);
        const matchAcc = acc?.name.toLowerCase().includes(q);
        if (!matchNote && !matchCat && !matchAcc) return false;
      }
      return true;
    });
  }, [transactions, filterType, searchQuery, categories, accounts]);

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-[var(--h)] bg-[var(--surface-card)]">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--m)]"
          />
          <input
            type="text"
            placeholder="Search transactions, notes, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[var(--bg)] border border-[var(--h)] rounded-lg text-xs text-[var(--i)] placeholder:text-[var(--m)] focus:outline-hidden focus:border-[var(--i)]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
              filterType === "all"
                ? "bg-[var(--p)] text-[var(--pt)] border-[var(--p)] shadow-2xs"
                : "bg-[var(--bg)] text-[var(--m)] border-[var(--h)] hover:text-[var(--i)]"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterType("expense")}
            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all flex items-center gap-1 ${
              filterType === "expense"
                ? "bg-rose-500 text-white border-rose-500 shadow-2xs"
                : "bg-[var(--bg)] text-[var(--m)] border-[var(--h)] hover:text-[var(--i)]"
            }`}
          >
            <ArrowDownLeft size={12} />
            Expenses
          </button>
          <button
            type="button"
            onClick={() => setFilterType("income")}
            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all flex items-center gap-1 ${
              filterType === "income"
                ? "bg-emerald-500 text-white border-emerald-500 shadow-2xs"
                : "bg-[var(--bg)] text-[var(--m)] border-[var(--h)] hover:text-[var(--i)]"
            }`}
          >
            <ArrowUpRight size={12} />
            Income
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex flex-col gap-2">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center border border-[var(--h)] rounded-2xl bg-[var(--surface-card)]">
            <p className="text-xs text-[var(--m)] font-medium">
              No transactions match your current search and filter
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const cat = categories.find((c) => c.id === tx.categoryId);
            const acc = accounts.find((a) => a.id === tx.accountId);
            const isExpense = tx.type === "expense";

            return (
              <div
                key={tx.id}
                className="group flex items-center justify-between p-3.5 rounded-xl border border-[var(--h)] bg-[var(--surface-card)] hover:border-[var(--m)]/50 transition-all"
              >
                {/* Left info: Icon, title, note, meta tags */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${cat?.color || "#3b82f6"}20`,
                      color: cat?.color || "#3b82f6",
                    }}
                  >
                    <CategoryIcon icon={cat?.icon || "Tag"} size={18} />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--i)] truncate">
                        {tx.note || cat?.name || "Transaction"}
                      </span>
                      {tx.isRecurring && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          <Repeat size={10} />
                          {tx.recurrenceFrequency || "Monthly"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[var(--m)] mt-0.5">
                      <span>{cat?.name}</span>
                      <span>•</span>
                      <span>{acc?.name}</span>
                      <span>•</span>
                      <span>{tx.date}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount, receipt icon, delete action */}
                <div className="flex items-center gap-3 shrink-0">
                  {tx.receiptUrl && (
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(tx.receiptUrl || null)}
                      className="text-blue-500 hover:text-blue-600 p-1.5 rounded-lg bg-blue-500/10 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                      title="View Receipt Photo"
                    >
                      <Receipt size={13} />
                      <span className="hidden sm:inline">Receipt</span>
                    </button>
                  )}

                  <div className="text-right">
                    <span
                      className={`text-sm font-semibold tracking-tight ${
                        isExpense ? "text-rose-500" : "text-emerald-500"
                      }`}
                    >
                      {isExpense ? "-" : "+"}
                      {formatCurrency(tx.amount, currency)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteTransaction(tx.id)}
                    className="opacity-0 group-hover:opacity-100 text-[var(--m)] hover:text-rose-500 p-1 transition-all"
                    title="Delete Transaction"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Receipt Photo Modal */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="relative max-w-lg w-full bg-[var(--bg)] border border-[var(--h)] rounded-2xl overflow-hidden p-4 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--h)] pb-2">
              <span className="text-xs font-semibold text-[var(--i)] flex items-center gap-1.5">
                <Receipt size={14} />
                Attached Receipt Proof
              </span>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="text-xs text-[var(--m)] hover:text-[var(--i)]"
              >
                Close
              </button>
            </div>
            <img
              src={selectedReceipt}
              alt="Receipt Preview"
              className="w-full max-h-96 object-contain rounded-xl bg-black/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
