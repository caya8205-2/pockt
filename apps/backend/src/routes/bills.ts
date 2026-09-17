import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { bills, billPayments } from '../db/schema.js';
import { eq, asc, desc, and, or, isNull } from 'drizzle-orm';
import { cryptoNative } from '../utils/id.js';
import { autoResetBills, getCurrentMonthCycle } from '../utils/billCycle.js';

const billSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  dueDate: z.number().int().min(1).max(31),
  notes: z.string().optional().nullable(),
});

const payBillSchema = z.object({
  amount: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional().nullable(),
  cycle: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

function getUserId(request: any): string {
  return request.userId || 'default';
}

export async function billRoutes(fastify: FastifyInstance) {
  fastify.get('/api/bills', async (request) => {
    const userId = getUserId(request);
    await autoResetBills(userId);
    const list = await db
      .select()
      .from(bills)
      .where(or(eq(bills.userId, userId), isNull(bills.userId)))
      .orderBy(asc(bills.dueDate));

    return list.map((b) => ({
      ...b,
      remainingAmount: b.remainingAmount ?? b.amount,
    }));
  });

  fastify.post('/api/bills', async (request, reply) => {
    const userId = getUserId(request);
    const body = billSchema.parse(request.body);
    const id = cryptoNative();
    const newItem = {
      id,
      userId,
      name: body.name,
      amount: body.amount,
      remainingAmount: body.amount,
      dueDate: body.dueDate,
      isPaid: false,
      notes: body.notes || null,
      lastPaidAt: null,
      lastPaidCycle: null,
      createdAt: new Date().toISOString(),
    };
    await db.insert(bills).values(newItem);
    return reply.status(201).send(newItem);
  });

  fastify.put('/api/bills/:id', async (request, reply) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };
    const body = billSchema.parse(request.body);

    const existing = await db
      .select()
      .from(bills)
      .where(and(eq(bills.id, id), or(eq(bills.userId, userId), isNull(bills.userId))))
      .limit(1);

    if (existing.length === 0) {
      return reply.status(404).send({ error: 'Bill not found' });
    }

    const current = existing[0];
    const currentRemaining = current.remainingAmount ?? current.amount;
    const diff = body.amount - current.amount;
    const newRemaining = Math.max(0, currentRemaining + diff);
    const isPaid = newRemaining === 0;
    const currentMonth = getCurrentMonthCycle();

    await db
      .update(bills)
      .set({
        name: body.name,
        amount: body.amount,
        remainingAmount: newRemaining,
        isPaid: isPaid,
        dueDate: body.dueDate,
        notes: body.notes || null,
        lastPaidCycle: isPaid ? (current.lastPaidCycle || currentMonth) : (newRemaining < body.amount ? current.lastPaidCycle : null),
      })
      .where(eq(bills.id, id));

    return { success: true };
  });

  fastify.post('/api/bills/:id/pay', async (request, reply) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };
    const body = payBillSchema.parse(request.body);

    const existing = await db
      .select()
      .from(bills)
      .where(and(eq(bills.id, id), or(eq(bills.userId, userId), isNull(bills.userId))))
      .limit(1);

    if (existing.length === 0) {
      return reply.status(404).send({ error: 'Bill not found' });
    }

    const bill = existing[0];
    const currentRemaining = bill.remainingAmount ?? bill.amount;
    const newRemaining = Math.max(0, currentRemaining - body.amount);
    const isPaid = newRemaining === 0;

    // Payment date determines cycle unless explicitly specified (e.g. paying early for next month)
    const paymentCycle = body.cycle || body.date.slice(0, 7);

    // Record bill payment in bill_payments table (NOT expenses table!)
    const paymentId = cryptoNative();
    await db.insert(billPayments).values({
      id: paymentId,
      userId,
      billId: id,
      amount: body.amount,
      date: body.date,
      notes: body.notes || bill.notes || null,
      createdAt: new Date().toISOString(),
    });

    // Update bill remaining amount and paid status
    await db
      .update(bills)
      .set({
        remainingAmount: newRemaining,
        isPaid: isPaid,
        lastPaidAt: body.date,
        lastPaidCycle: isPaid ? paymentCycle : (bill.lastPaidCycle || paymentCycle),
      })
      .where(eq(bills.id, id));

    return { success: true, remainingAmount: newRemaining, isPaid, lastPaidCycle: paymentCycle };
  });

  fastify.get('/api/bills/:id/payments', async (request, reply) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };
    const payments = await db
      .select()
      .from(billPayments)
      .where(and(eq(billPayments.billId, id), or(eq(billPayments.userId, userId), isNull(billPayments.userId))))
      .orderBy(desc(billPayments.date));
    return payments;
  });

  fastify.post('/api/bills/:id/toggle-paid', async (request, reply) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };
    const existing = await db
      .select()
      .from(bills)
      .where(and(eq(bills.id, id), or(eq(bills.userId, userId), isNull(bills.userId))))
      .limit(1);

    if (existing.length === 0) {
      return reply.status(404).send({ error: 'Bill not found' });
    }

    const bill = existing[0];
    const nextIsPaid = !bill.isPaid;
    const nextRemaining = nextIsPaid ? 0 : bill.amount;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentCycle = getCurrentMonthCycle(now);

    await db
      .update(bills)
      .set({
        isPaid: nextIsPaid,
        remainingAmount: nextRemaining,
        lastPaidAt: nextIsPaid ? todayStr : bill.lastPaidAt,
        lastPaidCycle: nextIsPaid ? currentCycle : null,
      })
      .where(eq(bills.id, id));

    return { success: true, isPaid: nextIsPaid };
  });

  fastify.post('/api/bills/reset-monthly', async (request) => {
    const userId = getUserId(request);
    const userBills = await db
      .select()
      .from(bills)
      .where(or(eq(bills.userId, userId), isNull(bills.userId)));

    for (const b of userBills) {
      await db
        .update(bills)
        .set({
          isPaid: false,
          remainingAmount: b.amount,
          lastPaidCycle: null,
        })
        .where(eq(bills.id, b.id));
    }

    return { success: true, message: 'Status tagihan berhasil di-reset untuk bulan baru.' };
  });

  fastify.delete('/api/bills/:id', async (request, reply) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };
    await db
      .delete(bills)
      .where(and(eq(bills.id, id), or(eq(bills.userId, userId), isNull(bills.userId))));

    return { success: true };
  });
}
