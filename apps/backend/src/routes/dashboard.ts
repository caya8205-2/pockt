import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { incomes, expenses, bills, billPayments, debts, debtPayments } from '../db/schema.js';
import { eq, or, isNull } from 'drizzle-orm';
import { autoResetBills } from '../utils/billCycle.js';

function getUserId(request: any): string {
  return request.userId || 'default';
}

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/api/dashboard', async (request) => {
    const userId = getUserId(request);
    await autoResetBills(userId);
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Total Incomes for this user
    const allIncomes = await db
      .select()
      .from(incomes)
      .where(or(eq(incomes.userId, userId), isNull(incomes.userId)));

    const totalIncomeAllTime = allIncomes.reduce((acc, curr) => acc + curr.amount, 0);
    const monthlyIncome = allIncomes
      .filter((i) => i.date.startsWith(currentMonth))
      .reduce((acc, curr) => acc + curr.amount, 0);

    // Total Expenses for this user (strictly daily operational expenses)
    const allExpenses = await db
      .select()
      .from(expenses)
      .where(or(eq(expenses.userId, userId), isNull(expenses.userId)));

    // Cash-draining expenses only (Paylater does NOT reduce cash balance immediately)
    const cashExpenses = allExpenses.filter(
      (e) => !e.isPaylater && e.paymentMethod !== 'GOPAY_LATER' && e.paymentMethod !== 'SPAYLATER' && e.paymentMethod !== 'OTHER_PAYLATER'
    );
    const totalCashExpensesAllTime = cashExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    // Monthly expenses (All expenses including paylater count towards monthly budget analytics)
    const monthlyExpenses = allExpenses
      .filter((e) => e.date.startsWith(currentMonth))
      .reduce((acc, curr) => acc + curr.amount, 0);

    // Total Debt Payments for this user
    const allDebtPayments = await db
      .select()
      .from(debtPayments)
      .where(or(eq(debtPayments.userId, userId), isNull(debtPayments.userId)));

    const totalDebtPaidAllTime = allDebtPayments.reduce((acc, curr) => acc + curr.amount, 0);

    // Total Bill Payments for this user
    const allBillPayments = await db
      .select()
      .from(billPayments)
      .where(or(eq(billPayments.userId, userId), isNull(billPayments.userId)));

    const totalBillPaidAllTime = allBillPayments.reduce((acc, curr) => acc + curr.amount, 0);

    // Current Balance = Total Income - Total Cash Expenses - Total Debt Payments - Total Bill Payments
    const currentBalance = totalIncomeAllTime - totalCashExpensesAllTime - totalDebtPaidAllTime - totalBillPaidAllTime;

    // Outstanding Bills (unpaid bills remaining amount) for this user
    const allBills = await db
      .select()
      .from(bills)
      .where(or(eq(bills.userId, userId), isNull(bills.userId)));

    const unpaidBills = allBills.filter((b) => !b.isPaid);
    const outstandingBills = unpaidBills.reduce((acc, curr) => acc + (curr.remainingAmount ?? curr.amount), 0);

    // Outstanding Debt (remaining amount on unpaid debts) for this user
    const allDebts = await db
      .select()
      .from(debts)
      .where(or(eq(debts.userId, userId), isNull(debts.userId)));

    const unpaidDebts = allDebts.filter((d) => !d.isPaid);
    const outstandingDebt = unpaidDebts.reduce((acc, curr) => acc + curr.remainingAmount, 0);

    // Free to Spend = Current Balance - Outstanding Bills - Outstanding Debt
    const freeToSpend = currentBalance - outstandingBills - outstandingDebt;

    return {
      currentBalance,
      monthlyIncome,
      monthlyExpenses,
      outstandingBills,
      outstandingDebt,
      freeToSpend,
      unpaidBillsCount: unpaidBills.length,
      unpaidDebtsCount: unpaidDebts.length,
    };
  });
}
