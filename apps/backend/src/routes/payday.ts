import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { incomes, expenses, bills, debts, debtPayments } from '../db/schema.js';
import { desc, eq, or, isNull } from 'drizzle-orm';

function getUserId(request: any): string {
  return request.userId || 'default';
}

export async function paydayRoutes(fastify: FastifyInstance) {
  fastify.get('/api/payday', async (request) => {
    const userId = getUserId(request);
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Recent main salary income for this user
    const allIncomes = await db
      .select()
      .from(incomes)
      .where(or(eq(incomes.userId, userId), isNull(incomes.userId)))
      .orderBy(desc(incomes.date));

    const monthlyIncomes = allIncomes.filter((i) => i.date.startsWith(currentMonth));
    const totalSalaryReceived = monthlyIncomes.reduce((acc, curr) => acc + curr.amount, 0);

    // Outstanding bills for this user
    const allBills = await db
      .select()
      .from(bills)
      .where(or(eq(bills.userId, userId), isNull(bills.userId)));

    const unpaidBills = allBills.filter((b) => !b.isPaid);
    const billsTotal = unpaidBills.reduce((acc, curr) => acc + (curr.remainingAmount ?? curr.amount), 0);

    // Debt repayments made THIS month
    const allDebtPayments = await db
      .select()
      .from(debtPayments)
      .where(or(eq(debtPayments.userId, userId), isNull(debtPayments.userId)));

    const monthlyDebtPayments = allDebtPayments.filter((dp) => dp.date.startsWith(currentMonth));
    const debtPaidThisMonth = monthlyDebtPayments.reduce((acc, curr) => acc + curr.amount, 0);

    // Debts due THIS month (or past due / no due date). Debts due in future months are excluded from this month's Payday Planning.
    const allDebts = await db
      .select()
      .from(debts)
      .where(or(eq(debts.userId, userId), isNull(debts.userId)));

    const unpaidDebts = allDebts.filter((d) => !d.isPaid);
    const dueDebtsThisMonth = unpaidDebts.filter((d) => {
      if (!d.dueDate) return true; // No due date = due/active
      return d.dueDate.slice(0, 7) <= currentMonth; // Due in current month or overdue
    });

    const debtDueThisMonth = dueDebtsThisMonth.reduce((acc, curr) => acc + curr.remainingAmount, 0);

    // Expenses spent this month for this user
    const allExpenses = await db
      .select()
      .from(expenses)
      .where(or(eq(expenses.userId, userId), isNull(expenses.userId)));

    const monthlyExpenses = allExpenses.filter((e) => e.date.startsWith(currentMonth));
    const spentTotal = monthlyExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    const freeToSpend = totalSalaryReceived - billsTotal - debtPaidThisMonth - debtDueThisMonth - spentTotal;

    return {
      salaryReceived: totalSalaryReceived,
      billsTotal,
      debtPaidThisMonth,
      debtDueThisMonth,
      debtPaidCount: monthlyDebtPayments.length,
      debtDueCount: dueDebtsThisMonth.length,
      spentTotal,
      freeToSpend,
      unpaidBills,
      dueDebtsThisMonth,
      // Backward compatibility keys
      debtDueTotal: debtDueThisMonth,
      unpaidDebts: dueDebtsThisMonth,
    };
  });
}

