// Charts Component: Category Breakdown (Donut/Pie), Monthly Trend (Bar/Area), Income vs. Expense
"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  PieChart as PieIcon,
  TrendingUp,
  BarChart3,
  Calendar,
} from "lucide-react";
import { useExpenseStore } from "@/store/expenseStore";
import { formatCurrency } from "@/lib/expenseUtils";
import { CategoryIcon } from "./CategoryIcon";

export function ExpenseCharts() {
  const { transactions, categories, currency, selectedMonth } =
    useExpenseStore();

  const [activeChartTab, setActiveChartTab] = useState<
    "breakdown" | "trend" | "comparison"
  >("breakdown");

  // Filter transactions for selected month
  const monthTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Category breakdown calculation
  const categoryData = useMemo(() => {
    const expenses = monthTransactions.filter((tx) => tx.type === "expense");
    const totals: Record<string, number> = {};

    for (const tx of expenses) {
      totals[tx.categoryId] = (totals[tx.categoryId] || 0) + tx.amount;
    }

    return Object.entries(totals)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          name: cat ? cat.name : "Other",
          value: Math.round(amount * 100) / 100,
          color: cat ? cat.color : "#9ca3af",
          icon: cat ? cat.icon : "Tag",
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [monthTransactions, categories]);

  // Multi-month comparison (last 6 months trend ending at selectedMonth or current month)
  const monthlyTrendData = useMemo(() => {
    // Determine the base reference date from selectedMonth (YYYY-MM) or today
    const [yearStr, monthStr] = (
      selectedMonth || new Date().toISOString().slice(0, 7)
    ).split("-");
    const baseYear = parseInt(yearStr || `${new Date().getFullYear()}`, 10);
    const baseMonth =
      parseInt(monthStr || `${new Date().getMonth() + 1}`, 10) - 1; // 0-indexed

    // Generate past 6 months chronologically ending at the base month
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(baseYear, baseMonth - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      months.push(`${y}-${m}`);
    }

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return months.map((m) => {
      const txsInMonth = transactions.filter((tx) => tx.date.startsWith(m));
      const income = txsInMonth
        .filter((tx) => tx.type === "income")
        .reduce((sum, tx) => sum + tx.amount, 0);
      const expense = txsInMonth
        .filter((tx) => tx.type === "expense")
        .reduce((sum, tx) => sum + tx.amount, 0);

      const [, mNum] = m.split("-");
      const label = monthNames[parseInt(mNum || "1", 10) - 1] || m;

      return {
        month: label,
        income: Math.round(income * 100) / 100,
        expense: Math.round(expense * 100) / 100,
        net: Math.round((income - expense) * 100) / 100,
      };
    });
  }, [transactions, selectedMonth]);

  const totalExpense = useMemo(
    () => categoryData.reduce((s, c) => s + c.value, 0),
    [categoryData],
  );

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl border border-[var(--h)] bg-[var(--surface-card)]">
      {/* Chart Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--h)]">
        <div>
          <h3 className="text-sm font-semibold text-[var(--i)] tracking-tight">
            Financial Analytics & Charts
          </h3>
          <p className="text-xs text-[var(--m)]">
            Visual breakdown of spending habits and cash flow
          </p>
        </div>

        {/* Chart View Toggle */}
        <div className="nav-pill-group p-1 flex self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveChartTab("breakdown")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-all ${
              activeChartTab === "breakdown"
                ? "bg-[var(--p)] text-[var(--pt)] shadow-2xs"
                : "text-[var(--m)] hover:text-[var(--i)]"
            }`}
          >
            <PieIcon size={13} />
            Breakdown
          </button>
          <button
            type="button"
            onClick={() => setActiveChartTab("comparison")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-all ${
              activeChartTab === "comparison"
                ? "bg-[var(--p)] text-[var(--pt)] shadow-2xs"
                : "text-[var(--m)] hover:text-[var(--i)]"
            }`}
          >
            <BarChart3 size={13} />
            Income vs Expense
          </button>
          <button
            type="button"
            onClick={() => setActiveChartTab("trend")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-all ${
              activeChartTab === "trend"
                ? "bg-[var(--p)] text-[var(--pt)] shadow-2xs"
                : "text-[var(--m)] hover:text-[var(--i)]"
            }`}
          >
            <TrendingUp size={13} />
            6-Month Trend
          </button>
        </div>
      </div>

      {/* Chart Content Area */}
      <div className="h-72 w-full pt-2">
        {activeChartTab === "breakdown" ? (
          categoryData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 h-full items-center gap-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={0}
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [
                        formatCurrency(Number(val) || 0, currency),
                        "Spent",
                      ]}
                      contentStyle={{
                        backgroundColor: "var(--bg)",
                        borderColor: "var(--h)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "var(--i)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend with percentages */}
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto styled-scrollbar pr-2">
                {categoryData.map((cat) => {
                  const pct =
                    totalExpense > 0
                      ? Math.round((cat.value / totalExpense) * 100)
                      : 0;
                  return (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-[var(--s)] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-medium text-[var(--i)] truncate max-w-[120px]">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--i)]">
                          {formatCurrency(cat.value, currency)}
                        </span>
                        <span className="text-[11px] text-[var(--m)] w-8 text-right">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-[var(--m)]">
              No expense transactions recorded in this month
            </div>
          )
        ) : activeChartTab === "comparison" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyTrendData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--h)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="var(--m)"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="var(--m)"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                formatter={(val: any) => [
                  formatCurrency(Number(val) || 0, currency),
                  "",
                ]}
                contentStyle={{
                  backgroundColor: "var(--bg)",
                  borderColor: "var(--h)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--i)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              <Bar
                dataKey="income"
                name="Income"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expense"
                name="Expense"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyTrendData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--h)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="var(--m)"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="var(--m)"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                formatter={(val: any) => [
                  formatCurrency(Number(val) || 0, currency),
                  "Net Cash Flow",
                ]}
                contentStyle={{
                  backgroundColor: "var(--bg)",
                  borderColor: "var(--h)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--i)",
                }}
              />
              <Bar
                dataKey="net"
                name="Net Savings / Cash Flow"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
