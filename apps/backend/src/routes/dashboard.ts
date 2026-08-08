import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { incomes, expenses, bills, debts, debtPayments } from '../db/schema.js';
import { eq, or, isNull } from 'drizzle-orm';

function getUserId(request: any): string {
  return request.cookies.pockt_session || 'default';
}

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/api/dashboard', async (request) => {
    const userId = getUserId(request);
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

    // Total Expenses for this user
    const allExpenses = await db
      .select()
      .from(expenses)
      .where(or(eq(expenses.userId, userId), isNull(expenses.userId)));

    const totalExpensesAllTime = allExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const monthlyExpenses = allExpenses
      .filter((e) => e.date.startsWith(currentMonth))
      .reduce((acc, curr) => acc + curr.amount, 0);

    // Total Debt Payments for this user
    const allDebtPayments = await db
      .select()
      .from(debtPayments)
      .where(or(eq(debtPayments.userId, userId), isNull(debtPayments.userId)));

    const totalDebtPaidAllTime = allDebtPayments.reduce((acc, curr) => acc + curr.amount, 0);

    // Current Balance = Total Income - Total Expenses - Total Debt Payments
    const currentBalance = totalIncomeAllTime - totalExpensesAllTime - totalDebtPaidAllTime;

    // Outstanding Bills (unpaid bills amount) for this user
    const allBills = await db
      .select()
      .from(bills)
      .where(or(eq(bills.userId, userId), isNull(bills.userId)));

    const unpaidBills = allBills.filter((b) => !b.isPaid);
    const outstandingBills = unpaidBills.reduce((acc, curr) => acc + curr.amount, 0);

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
