import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { debts, debtPayments, bills, billPayments } from '../db/schema.js';
import { eq, desc, or, isNull } from 'drizzle-orm';

function getUserId(request: any): string {
  return request.userId || 'default';
}

export async function settledRoutes(fastify: FastifyInstance) {
  fastify.get('/api/settled', async (request) => {
    const userId = getUserId(request);

    // Settled debts (isPaid = true)
    const allDebts = await db
      .select()
      .from(debts)
      .where(or(eq(debts.userId, userId), isNull(debts.userId)));

    const settledDebts = allDebts.filter((d) => d.isPaid);

    const allDebtPayments = await db
      .select()
      .from(debtPayments)
      .where(or(eq(debtPayments.userId, userId), isNull(debtPayments.userId)));

    const paymentsByDebt = new Map<string, typeof allDebtPayments>();
    for (const dp of allDebtPayments) {
      if (!paymentsByDebt.has(dp.debtId)) paymentsByDebt.set(dp.debtId, []);
      paymentsByDebt.get(dp.debtId)!.push(dp);
    }

    const debtsResult = settledDebts.map((d) => {
      const payments = paymentsByDebt.get(d.id) || [];
      const totalPaid = payments.reduce((acc, curr) => acc + curr.amount, 0);
      const settledAt = payments.length > 0
        ? payments.map((p) => p.date).sort().reverse()[0]
        : null;

      return {
        id: d.id,
        person: d.person,
        totalAmount: d.totalAmount,
        remainingAmount: d.remainingAmount,
        dueDate: d.dueDate,
        notes: d.notes,
        createdAt: d.createdAt,
        settledAt,
        totalPaid,
        paymentsCount: payments.length,
      };
    });

    // Bill payment history (bills that were paid off)
    const allBills = await db
      .select()
      .from(bills)
      .where(or(eq(bills.userId, userId), isNull(bills.userId)));

    const billMap = new Map(allBills.map((b) => [b.id, b.name]));

    const allBillPayments = await db
      .select()
      .from(billPayments)
      .where(or(eq(billPayments.userId, userId), isNull(billPayments.userId)))
      .orderBy(desc(billPayments.date));

    const billPaymentsResult = allBillPayments.slice(0, 100).map((bp) => ({
      id: bp.id,
      billId: bp.billId,
      billName: billMap.get(bp.billId) || 'Tagihan',
      amount: bp.amount,
      date: bp.date,
      notes: bp.notes,
    }));

    const settledDebtTotal = settledDebts.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const billPaymentsTotal = allBillPayments.reduce((acc, curr) => acc + curr.amount, 0);

    return {
      debts: debtsResult.sort((a, b) => {
        if (!a.settledAt) return 1;
        if (!b.settledAt) return -1;
        return new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime();
      }),
      billPayments: billPaymentsResult,
      totals: {
        settledDebtCount: settledDebts.length,
        settledDebtTotal,
        billPaymentsCount: allBillPayments.length,
        billPaymentsTotal,
      },
    };
  });
}
