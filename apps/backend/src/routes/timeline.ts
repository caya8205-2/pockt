import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { incomes, expenses, bills, billPayments, debtPayments, debts } from '../db/schema.js';
import { eq, or, isNull } from 'drizzle-orm';

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

function getUserId(request: any): string {
  return request.userId || 'default';
}

export async function timelineRoutes(fastify: FastifyInstance) {
  fastify.get('/api/timeline', async (request) => {
    const userId = getUserId(request);
    const allIncomes = await db
      .select()
      .from(incomes)
      .where(or(eq(incomes.userId, userId), isNull(incomes.userId)));

    const allExpenses = await db
      .select()
      .from(expenses)
      .where(or(eq(expenses.userId, userId), isNull(expenses.userId)));

    const allBills = await db
      .select()
      .from(bills)
      .where(or(eq(bills.userId, userId), isNull(bills.userId)));

    const allBillPayments = await db
      .select()
      .from(billPayments)
      .where(or(eq(billPayments.userId, userId), isNull(billPayments.userId)));

    const allDebtPayments = await db
      .select()
      .from(debtPayments)
      .where(or(eq(debtPayments.userId, userId), isNull(debtPayments.userId)));

    const allDebts = await db
      .select()
      .from(debts)
      .where(or(eq(debts.userId, userId), isNull(debts.userId)));

    const debtMap = new Map(allDebts.map((d) => [d.id, d.person]));
    const billMap = new Map(allBills.map((b) => [b.id, b.name]));

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

    // Add Bill Payments
    for (const bp of allBillPayments) {
      const billName = billMap.get(bp.billId) || 'Tagihan';
      items.push({
        id: bp.id,
        type: 'bill',
        title: `Pembayaran Tagihan: ${billName}`,
        amount: bp.amount,
        date: bp.date,
        notes: bp.notes,
        status: 'Lunas',
      });
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
