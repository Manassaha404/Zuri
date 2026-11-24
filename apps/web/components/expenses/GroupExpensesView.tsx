// Group Expenses view (trips, flatmates) with Simplified Debts engine
"use client";

import { useMemo, useState } from "react";
import {
  Users,
  Compass,
  Home,
  Plus,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Receipt,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useExpenses } from "@/hook/expenses";
import { useExpenseStore } from "@/store/expenseStore";
import { formatCurrency, simplifyDebts } from "@/lib/expenseUtils";

interface GroupExpensesViewProps {
  onOpenSplitModal: (groupId?: string) => void;
  onOpenCreateGroupModal?: () => void;
}

export function GroupExpensesView({
  onOpenSplitModal,
  onOpenCreateGroupModal,
}: GroupExpensesViewProps) {
  const resolvePersonName = (personId: string) => {
    if (personId === "p_you") return "You";
    const p = people.find((person) => person.id === personId);
    return p?.name || "Member";
  };
  const {
    groups,
    people,
    billSplits,
    currency,
    toggleSplitItemPaid,
    deleteBillSplit,
    deleteGroup,
  } = useExpenses();
  const { selectedGroupId, setSelectedGroupId } = useExpenseStore();

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    if (
      confirm(
        `Are you sure you want to delete the group "${groupName}"? All split bills in this group will also be removed.`,
      )
    ) {
      deleteGroup(groupId);
      if (selectedGroupId === groupId) {
        setSelectedGroupId(null);
      }
    }
  };

  const activeGroup = groups.find(
    (g) => g.id === (selectedGroupId || groups[0]?.id),
  );

  // Compute group balances and debt simplification
  const { groupSplits, balances, simplifiedDebts, totalGroupSpend } =
    useMemo(() => {
      if (!activeGroup) {
        return {
          groupSplits: [],
          balances: {},
          simplifiedDebts: [],
          totalGroupSpend: 0,
        };
      }

      const splits = billSplits.filter((b) => b.groupId === activeGroup.id);
      const balMap: Record<string, number> = {};

      for (const mId of activeGroup.memberIds) {
        balMap[mId] = 0;
      }

      let totalSpend = 0;

      for (const split of splits) {
        totalSpend += split.totalAmount;
        // Person who paid gets credited
        balMap[split.paidByPersonId] =
          (balMap[split.paidByPersonId] || 0) + split.totalAmount;

        // Each participant owes their share
        for (const item of split.splits) {
          balMap[item.personId] = (balMap[item.personId] || 0) - item.amount;
        }
      }

      const simplified = simplifyDebts(balMap);

      return {
        groupSplits: splits,
        balances: balMap,
        simplifiedDebts: simplified,
        totalGroupSpend: totalSpend,
      };
    }, [activeGroup, billSplits]);

  return (
    <div className="flex flex-col gap-6">
      {/* Group Header & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">
            <Users size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--i)]">
              Expense Groups ({groups.length})
            </h3>
          </div>
        </div>
        {onOpenCreateGroupModal && (
          <button
            type="button"
            onClick={onOpenCreateGroupModal}
            className=" flex-1 bt p text-xs font-semibold px-3.5 py-1.5 flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>New Group</span>
          </button>
        )}
      </div>

      {/* Group Selector Cards */}
      {groups.length === 0 ? (
        <div className="p-8 text-center border border-[var(--h)] rounded-2xl bg-[var(--surface-card)] flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[var(--s)] text-[var(--m)] flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--i)]">
              No Groups Created Yet
            </h4>
            <p className="text-xs text-[var(--m)] max-w-sm mt-0.5">
              Create an expense group to easily split rent, trips, or dining
              bills and automatically simplify cross-debts.
            </p>
          </div>
          {onOpenCreateGroupModal && (
            <button
              type="button"
              onClick={onOpenCreateGroupModal}
              className="bt p text-xs font-semibold px-4 py-2 flex items-center gap-1.5 mt-2"
            >
              <Plus size={14} />
              Create First Group
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {groups.map((group) => {
            const isSelected = activeGroup?.id === group.id;
            // Deduplicate member display names so "You" is never shown twice
            const rawNames = group.memberIds.map((mId) => {
              if (mId === "p_you") return "You";
              const p = people.find((person) => person.id === mId);
              return p?.name === "You" ? "You" : p?.name || "Member";
            });
            const memberNames = Array.from(new Set(rawNames)).join(", ");

            return (
              <div
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "border-[var(--p)] bg-[var(--s)] shadow-xs"
                    : "border-[var(--h)] bg-[var(--surface-card)] hover:border-[var(--m)]/60"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${group.color}20`,
                      color: group.color,
                    }}
                  >
                    {group.icon === "Compass" ? (
                      <Compass size={20} />
                    ) : (
                      <Home size={20} />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-[var(--i)] truncate">
                      {group.name}
                    </span>
                    <p className="text-[11px] text-[var(--m)] truncate">
                      {memberNames}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(group.id, group.name);
                    }}
                    className="p-1.5 rounded-lg text-[var(--m)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    title={`Delete group ${group.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight
                    size={16}
                    className={
                      isSelected ? "text-[var(--i)]" : "text-[var(--m)]"
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeGroup && (
        <div className="flex flex-col gap-5">
          {/* Active Group Header & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[var(--h)] bg-[var(--surface-card)]">
            <div>
              <h3 className="text-sm font-semibold text-[var(--i)]">
                {activeGroup.name}
              </h3>
              <p className="text-xs text-[var(--m)]">
                {activeGroup.description ||
                  "Shared group expenses & simplified repayments"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right mr-1">
                <span className="text-base font-bold text-[var(--i)]">
                  {formatCurrency(totalGroupSpend, currency)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onOpenSplitModal(activeGroup.id)}
                className="bt p text-xs font-semibold px-3.5 py-2 flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Split Bill</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDeleteGroup(activeGroup.id, activeGroup.name)
                }
                className="bt text-xs font-medium px-2.5 py-2 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 flex items-center gap-1 transition-all"
                title="Delete Group"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>

          {/* Debt Simplification Card: "Simplified Debts" */}
          <div className="p-5 rounded-2xl border border-blue-500/25 bg-blue-500/5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-blue-500">
              <Sparkles size={16} />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Simplified Debts (Minimum Transfers)
              </h4>
            </div>
            <p className="text-xs text-[var(--m)]">
              Reduces multiple cross-debts into the fewest possible clean
              payments:
            </p>

            <div className="flex flex-col gap-2 mt-1">
              {simplifiedDebts.length === 0 ? (
                <div className="text-xs text-[var(--m)] italic">
                  Everyone is settled up in this group!
                </div>
              ) : (
                simplifiedDebts.map((item, index) => {
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl border border-[var(--h)] bg-[var(--bg)]"
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-[var(--i)]">
                          {resolvePersonName(item.fromPersonId)}
                        </span>
                        <span className="text-[var(--m)]">pays</span>
                        <span className="font-semibold text-[var(--i)]">
                          {resolvePersonName(item.toPersonId)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-500">
                          {formatCurrency(item.amount, currency)}
                        </span>
                        <ArrowRight size={13} className="text-[var(--m)]" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Group Split Transactions History */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">
              Group Bill History ({groupSplits.length})
            </span>

            <div className="flex flex-col gap-2">
              {groupSplits.length === 0 ? (
                <div className="p-8 text-center border border-[var(--h)] rounded-xl bg-[var(--surface-card)]">
                  <p className="text-xs text-[var(--m)]">
                    No shared bills split in this group yet. Click "Split in
                    Group" to add one!
                  </p>
                </div>
              ) : (
                groupSplits.map((split) => {
                  const payerName = resolvePersonName(split.paidByPersonId);

                  return (
                    <div
                      key={split.id}
                      className="p-3.5 rounded-xl border border-[var(--h)] bg-[var(--surface-card)] flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-[var(--i)]">
                            {split.title}
                          </span>
                          <p className="text-[11px] text-[var(--m)]">
                            Paid by{" "}
                            <strong className="text-[var(--i)]">
                              {payerName}
                            </strong>{" "}
                            on {split.date}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-[var(--i)]">
                            {formatCurrency(split.totalAmount, currency)}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteBillSplit(split.id)}
                            className="text-[var(--m)] hover:text-rose-500 transition-colors"
                            title="Delete split bill"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Participant shares pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[var(--h)]">
                        {split.splits.map((s) => {
                          const participantName = resolvePersonName(s.personId);
                          return (
                            <button
                              key={s.personId}
                              type="button"
                              onClick={() =>
                                toggleSplitItemPaid(split.id, s.personId)
                              }
                              className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all ${
                                s.isPaid
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                  : "bg-[var(--s)] text-[var(--m)] border-[var(--h)] hover:text-[var(--i)]"
                              }`}
                              title={s.isPaid ? "Paid" : "Mark as Paid"}
                            >
                              <span>{participantName}</span>
                              <span className="font-semibold">
                                {formatCurrency(s.amount, currency)}
                              </span>
                              {s.isPaid && <CheckCircle2 size={10} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
