import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { incomes, expenses, bills, debts, debtPayments } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/api/dashboard', async () => {
    // Current month string YYYY-MM
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Total Incomes
    const allIncomes = await db.select().from(incomes);
    const totalIncomeAllTime = allIncomes.reduce((acc, curr) => acc + curr.amount, 0);
    const monthlyIncome = allIncomes
      .filter((i) => i.date.startsWith(currentMonth))
      .reduce((acc, curr) => acc + curr.amount, 0);

    // Total Expenses
    const allExpenses = await db.select().from(expenses);
    const totalExpensesAllTime = allExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const monthlyExpenses = allExpenses
      .filter((e) => e.date.startsWith(currentMonth))
      .reduce((acc, curr) => acc + curr.amount, 0);

    // Total Debt Payments
    const allDebtPayments = await db.select().from(debtPayments);
    const totalDebtPaidAllTime = allDebtPayments.reduce((acc, curr) => acc + curr.amount, 0);

    // Current Balance = Total Income - Total Expenses - Total Debt Payments
    const currentBalance = totalIncomeAllTime - totalExpensesAllTime - totalDebtPaidAllTime;

    // Outstanding Bills (unpaid bills amount)
    const allBills = await db.select().from(bills);
    const unpaidBills = allBills.filter((b) => !b.isPaid);
    const outstandingBills = unpaidBills.reduce((acc, curr) => acc + curr.amount, 0);

    // Outstanding Debt (remaining amount on unpaid debts)
    const allDebts = await db.select().from(debts);
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
