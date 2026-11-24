// Main Expenses Workspace coordinator component
"use client";

import { useState } from "react";
import { useInitUIStore } from "@/store/uiStore";
import { useExpenseStore } from "@/store/expenseStore";
import { useExpenses } from "@/hook/expenses";
import { ExpensesHeader } from "./ExpensesHeader";
import { ExpenseCharts } from "./ExpenseCharts";
import { TransactionListView } from "./TransactionListView";
import { DebtSummaryDashboard } from "./DebtSummaryDashboard";
import { DebtPeopleList } from "./DebtPeopleList";
import { PersonDebtTimeline } from "./PersonDebtTimeline";
import { GroupExpensesView } from "./GroupExpensesView";
import { TransactionModal } from "./TransactionModal";
import { DebtEntryModal } from "./DebtEntryModal";
import { BillSplitModal } from "./BillSplitModal";
import { AccountsBudgetsModal } from "./AccountsBudgetsModal";
import { GroupModal } from "./GroupModal";
import { PersonModal } from "./PersonModal";
import { CategoriesModal } from "./CategoriesModal";

export function ExpensesWorkspace() {
  useInitUIStore();
  const { isLoading } = useExpenses();
  const { activeTab, selectedPersonId, setSelectedPersonId } =
    useExpenseStore();

  // Modals state
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [debtModalPersonId, setDebtModalPersonId] = useState<string | null>(
    null,
  );
  const [debtModalAction, setDebtModalAction] = useState<
    "lent" | "borrowed" | "they_paid" | "i_paid"
  >("lent");
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [splitModalGroupId, setSplitModalGroupId] = useState<string | null>(
    null,
  );
  const [accountsBudgetsOpen, setAccountsBudgetsOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);

  const handleOpenAddDebt = (
    personId?: string,
    action?: "they_paid" | "i_paid" | "lent" | "borrowed",
  ) => {
    setDebtModalPersonId(personId || selectedPersonId || null);
    setDebtModalAction(action || "lent");
    setDebtModalOpen(true);
  };

  const handleOpenSplitBill = (groupId?: string) => {
    setSplitModalGroupId(groupId || null);
    setSplitModalOpen(true);
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--b)] styled-scrollbar">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Workspace Header */}
        <ExpensesHeader
          onOpenAddTransaction={() => setTxModalOpen(true)}
          onOpenAddDebt={() => handleOpenAddDebt()}
          onOpenSplitBill={() => handleOpenSplitBill()}
          onOpenManageAccounts={() => setAccountsBudgetsOpen(true)}
          onOpenManagePeople={() => setPersonModalOpen(true)}
          onOpenCreateGroup={() => setGroupModalOpen(true)}
          onOpenManageCategories={() => setCategoriesModalOpen(true)}
        />

        {/* Tab 1: Overview & Analytics */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            <DebtSummaryDashboard
              onOpenNewEntry={() => handleOpenAddDebt()}
              onSelectPerson={(pId) => setSelectedPersonId(pId)}
            />
            <ExpenseCharts />
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-[var(--i)] tracking-tight">
                Recent Transactions
              </h3>
              <TransactionListView
                onOpenAddModal={() => setTxModalOpen(true)}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Debt Ledger (The Core Request) */}
        {activeTab === "debts" && (
          <div className="flex flex-col gap-6">
            <DebtSummaryDashboard
              onOpenNewEntry={() => handleOpenAddDebt()}
              onSelectPerson={(pId) => setSelectedPersonId(pId)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* People List */}
              <div
                className={`${selectedPersonId ? "lg:col-span-5" : "lg:col-span-12"} flex flex-col gap-4`}
              >
                <DebtPeopleList
                  selectedPersonId={selectedPersonId}
                  onSelectPerson={(pId) => setSelectedPersonId(pId)}
                  onOpenAddModal={(pId) => handleOpenAddDebt(pId)}
                  onOpenAddPersonModal={() => setPersonModalOpen(true)}
                />
              </div>

              {/* Per-Person Timeline History & Repayments (Side Inspector) */}
              {selectedPersonId && (
                <div className="lg:col-span-7">
                  <PersonDebtTimeline
                    personId={selectedPersonId}
                    onClose={() => setSelectedPersonId(null)}
                    onOpenAddModal={(action) =>
                      handleOpenAddDebt(selectedPersonId, action)
                    }
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Expenses & Income Management */}
        {activeTab === "expenses" && (
          <div className="flex flex-col gap-6">
            <ExpenseCharts />
            <TransactionListView onOpenAddModal={() => setTxModalOpen(true)} />
          </div>
        )}

        {/* Tab 4: Bill Splitting & Group Expenses */}
        {activeTab === "splits" && (
          <div className="flex flex-col gap-6">
            <GroupExpensesView
              onOpenSplitModal={(gId) => handleOpenSplitBill(gId)}
              onOpenCreateGroupModal={() => setGroupModalOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Floating Modals */}
      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
      />

      <DebtEntryModal
        isOpen={debtModalOpen}
        onClose={() => setDebtModalOpen(false)}
        preselectedPersonId={debtModalPersonId}
        defaultAction={debtModalAction}
      />

      <BillSplitModal
        isOpen={splitModalOpen}
        onClose={() => setSplitModalOpen(false)}
        defaultGroupId={splitModalGroupId}
      />

      <AccountsBudgetsModal
        isOpen={accountsBudgetsOpen}
        onClose={() => setAccountsBudgetsOpen(false)}
      />

      <GroupModal
        isOpen={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
      />

      <PersonModal
        isOpen={personModalOpen}
        onClose={() => setPersonModalOpen(false)}
      />

      <CategoriesModal
        isOpen={categoriesModalOpen}
        onClose={() => setCategoriesModalOpen(false)}
      />
    </div>
  );
}
