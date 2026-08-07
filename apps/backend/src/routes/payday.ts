import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { incomes, expenses, bills, debts } from '../db/schema.js';
import { desc } from 'drizzle-orm';

export async function paydayRoutes(fastify: FastifyInstance) {
  fastify.get('/api/payday', async () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Recent main salary income (or total income current month)
    const allIncomes = await db.select().from(incomes).orderBy(desc(incomes.date));
    const monthlyIncomes = allIncomes.filter((i) => i.date.startsWith(currentMonth));
    const totalSalaryReceived = monthlyIncomes.reduce((acc, curr) => acc + curr.amount, 0);

    // Outstanding bills
    const allBills = await db.select().from(bills);
    const unpaidBills = allBills.filter((b) => !b.isPaid);
    const billsTotal = unpaidBills.reduce((acc, curr) => acc + curr.amount, 0);

    // Outstanding debt
    const allDebts = await db.select().from(debts);
    const unpaidDebts = allDebts.filter((d) => !d.isPaid);
    const debtDueTotal = unpaidDebts.reduce((acc, curr) => acc + curr.remainingAmount, 0);

    // Expenses spent this month
    const allExpenses = await db.select().from(expenses);
    const monthlyExpenses = allExpenses.filter((e) => e.date.startsWith(currentMonth));
    const spentTotal = monthlyExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    const freeToSpend = totalSalaryReceived - billsTotal - debtDueTotal - spentTotal;

    return {
      salaryReceived: totalSalaryReceived,
      billsTotal,
      debtDueTotal,
      spentTotal,
      freeToSpend,
      unpaidBills,
      unpaidDebts,
    };
  });
}
