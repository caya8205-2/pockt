import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { incomes, expenses, bills, debtPayments, debts } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export interface TimelineItem {
  id: string;
  type: 'income' | 'expense' | 'bill' | 'debt_payment';
  title: string;
  amount: number;
  date: string;
  category?: string;
  notes?: string | null;
  status?: string;
}

export async function timelineRoutes(fastify: FastifyInstance) {
  fastify.get('/api/timeline', async () => {
    const allIncomes = await db.select().from(incomes);
    const allExpenses = await db.select().from(expenses);
    const allBills = await db.select().from(bills);
    const allDebtPayments = await db.select().from(debtPayments);
    const allDebts = await db.select().from(debts);

    const debtMap = new Map(allDebts.map((d) => [d.id, d.person]));

    const items: TimelineItem[] = [];

    // Add Incomes
    for (const inc of allIncomes) {
      items.push({
        id: inc.id,
        type: 'income',
        title: inc.title,
        amount: inc.amount,
        date: inc.date,
        notes: inc.notes,
      });
    }

    // Add Expenses
    for (const exp of allExpenses) {
      items.push({
        id: exp.id,
        type: 'expense',
        title: exp.title,
        amount: exp.amount,
        date: exp.date,
        category: exp.category,
        notes: exp.notes,
      });
    }

    // Add Paid Bills or Due Bills
    for (const bill of allBills) {
      if (bill.isPaid && bill.lastPaidAt) {
        items.push({
          id: `bill-${bill.id}`,
          type: 'bill',
          title: `Tagihan: ${bill.name}`,
          amount: bill.amount,
          date: bill.lastPaidAt.split('T')[0],
          notes: bill.notes,
          status: 'Lunas',
        });
      }
    }

    // Add Debt Payments
    for (const dp of allDebtPayments) {
      const person = debtMap.get(dp.debtId) || 'Hutang';
      items.push({
        id: dp.id,
        type: 'debt_payment',
        title: `Bayar Hutang (${person})`,
        amount: dp.amount,
        date: dp.date,
        notes: dp.notes,
      });
    }

    // Sort descending by date
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return items;
  });
}
