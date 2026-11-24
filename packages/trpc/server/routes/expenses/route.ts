import { router, protectedProcedure } from "../../trpc";
import { handleRouteError } from "../../utils/error";
import { expenseService } from "../../services";
import {
  addTransactionDto,
  transactionIdDto,
  addAccountDto,
  accountIdDto,
  addCategoryDto,
  categoryIdDto,
  setBudgetDto,
  addPersonDto,
  personIdDto,
  addDebtEntryDto,
  addDebtRepaymentDto,
  debtEntryIdDto,
  addBillSplitDto,
  toggleSplitItemPaidDto,
  splitIdDto,
  addGroupDto,
  groupIdDto,
  setCurrencyDto,
} from "./model";

export const expensesRouter = router({
  // Get full workspace data (categories, accounts, budgets, transactions, debt entries, people, groups, splits)
  getWorkspace: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await expenseService.getWorkspace(ctx.user.id);
    } catch (error) {
      return handleRouteError(error);
    }
  }),

  // Transactions
  addTransaction: protectedProcedure
    .input(addTransactionDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await expenseService.addTransaction(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  deleteTransaction: protectedProcedure
    .input(transactionIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await expenseService.deleteTransaction(
          ctx.user.id,
          input.transactionId,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Accounts & Budgets
  addAccount: protectedProcedure
    .input(addAccountDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await expenseService.addAccount(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  deleteAccount: protectedProcedure
    .input(accountIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await expenseService.deleteAccount(ctx.user.id, input.accountId);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  addCategory: protectedProcedure
    .input(addCategoryDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await expenseService.addCategory(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  deleteCategory: protectedProcedure
    .input(categoryIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await expenseService.deleteCategory(
          ctx.user.id,
          input.categoryId,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  setBudget: protectedProcedure
    .input(setBudgetDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await expenseService.setBudget(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // People
  addPerson: protectedProcedure
    .input(addPersonDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await expenseService.addPerson(ctx.user.id, {
          ...input,
          email: input.email || undefined,
        });
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  deletePerson: protectedProcedure
    .input(personIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await expenseService.deletePerson(ctx.user.id, input.personId);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Debt Ledger
  addDebtEntry: protectedProcedure
    .input(addDebtEntryDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await expenseService.addDebtEntry(ctx.user.id, {
          ...input,
          dueDate: input.dueDate || undefined,
        });
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  addDebtRepayment: protectedProcedure
    .input(addDebtRepaymentDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await expenseService.addDebtRepayment(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  settlePersonDebts: protectedProcedure
    .input(personIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await expenseService.settlePersonDebts(
          ctx.user.id,
          input.personId,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  deleteDebtEntry: protectedProcedure
    .input(debtEntryIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await expenseService.deleteDebtEntry(ctx.user.id, input.entryId);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Bill Splits & Groups
  addBillSplit: protectedProcedure
    .input(addBillSplitDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await expenseService.addBillSplit(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  toggleSplitItemPaid: protectedProcedure
    .input(toggleSplitItemPaidDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await expenseService.toggleSplitItemPaid(
          ctx.user.id,
          input.splitId,
          input.personId,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  deleteBillSplit: protectedProcedure
    .input(splitIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await expenseService.deleteBillSplit(ctx.user.id, input.splitId);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  addGroup: protectedProcedure
    .input(addGroupDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await expenseService.addGroup(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  deleteGroup: protectedProcedure
    .input(groupIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await expenseService.deleteGroup(ctx.user.id, input.groupId);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  // Preferred Currency
  setCurrency: protectedProcedure
    .input(setCurrencyDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await expenseService.setPreferredCurrency(
          ctx.user.id,
          input.currency,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),
});
