import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { debts, debtPayments, expenses } from '../db/schema.js';
import { eq, desc, and, or, isNull } from 'drizzle-orm';
import { cryptoNative } from '../utils/id.js';

export function inferDebtType(person: string, explicitType?: string | null): string {
  if (explicitType && explicitType.trim().length > 0) return explicitType.toUpperCase();
  const lower = person.toLowerCase();
  if (lower.includes('gopay') || lower.includes('go-pay')) return 'GOPAY_LATER';
  if (lower.includes('spaylater') || lower.includes('shopee') || lower.includes('shopeepay')) return 'SPAYLATER';
  if (lower.includes('paylater')) return 'OTHER_PAYLATER';
  return 'PERSONAL';
}

const debtSchema = z.object({
  person: z.string().min(1),
  type: z.string().optional().nullable(),
  totalAmount: z.number().positive(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional().nullable(),
});

function getUserId(request: any): string {
  return request.userId || 'default';
}

export async function debtRoutes(fastify: FastifyInstance) {
  fastify.get('/api/debts', async (request) => {
    const userId = getUserId(request);
    const query = request.query as { type?: string } | undefined;

    let list = await db
      .select()
      .from(debts)
      .where(and(or(eq(debts.userId, userId), isNull(debts.userId)), eq(debts.isPaid, false)))
      .orderBy(desc(debts.createdAt));

    if (query?.type) {
      list = list.filter((d) => (d.type || '').toUpperCase() === query.type!.toUpperCase());
    }

    return list;
  });

  fastify.post('/api/debts', async (request, reply) => {
    const userId = getUserId(request);
    const body = debtSchema.parse(request.body);
    const id = cryptoNative();
    const type = inferDebtType(body.person, body.type);

    const newItem = {
      id,
      userId,
      person: body.person,
      type,
      totalAmount: body.totalAmount,
      remainingAmount: body.totalAmount,
      dueDate: body.dueDate || null,
      isPaid: false,
      notes: body.notes || null,
      createdAt: new Date().toISOString(),
    };
    await db.insert(debts).values(newItem);
    return reply.status(201).send(newItem);
  });

  fastify.put('/api/debts/:id', async (request, reply) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };
    const body = debtSchema.parse(request.body);

    const existing = await db
      .select()
      .from(debts)
      .where(and(eq(debts.id, id), or(eq(debts.userId, userId), isNull(debts.userId))))
      .limit(1);

    if (existing.length === 0) {
      return reply.status(404).send({ error: 'Debt record not found' });
    }

    const current = existing[0];
    const type = body.type !== undefined ? inferDebtType(body.person, body.type) : (current.type || inferDebtType(body.person));
    const diff = body.totalAmount - current.totalAmount;
    const newRemaining = Math.max(0, current.remainingAmount + diff);
    const isPaid = newRemaining === 0;

    await db
      .update(debts)
      .set({
        person: body.person,
        type: type,
        totalAmount: body.totalAmount,
        remainingAmount: newRemaining,
        dueDate: body.dueDate || null,
        isPaid: isPaid,
        notes: body.notes || null,
      })
      .where(eq(debts.id, id));

    return { success: true };
  });

  fastify.post('/api/debts/:id/pay', async (request, reply) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };
    const body = paymentSchema.parse(request.body);

    const existing = await db
      .select()
      .from(debts)
      .where(and(eq(debts.id, id), or(eq(debts.userId, userId), isNull(debts.userId))))
      .limit(1);

    if (existing.length === 0) {
      return reply.status(404).send({ error: 'Debt record not found' });
    }

    const debt = existing[0];
    const newRemaining = Math.max(0, debt.remainingAmount - body.amount);
    const isPaid = newRemaining === 0;

    // Record payment
    const paymentId = cryptoNative();
    await db.insert(debtPayments).values({
      id: paymentId,
      userId,
      debtId: id,
      amount: body.amount,
      date: body.date,
      notes: body.notes || null,
      createdAt: new Date().toISOString(),
    });

    // Update debt remaining amount & paid status
    await db
      .update(debts)
      .set({
        remainingAmount: newRemaining,
        isPaid: isPaid,
      })
      .where(eq(debts.id, id));

    return { success: true, remainingAmount: newRemaining, isPaid };
  });

  fastify.get('/api/debts/:id/payments', async (request, reply) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };
    const payments = await db
      .select()
      .from(debtPayments)
      .where(and(eq(debtPayments.debtId, id), or(eq(debtPayments.userId, userId), isNull(debtPayments.userId))))
      .orderBy(desc(debtPayments.date));
    return payments;
  });

  fastify.get('/api/debts/:id/expenses', async (request, reply) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };
    const list = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.debtId, id), or(eq(expenses.userId, userId), isNull(expenses.userId))))
      .orderBy(desc(expenses.date), desc(expenses.createdAt));
    return list;
  });

  fastify.post('/api/debts/:id/restore', async (request, reply) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };

    const existing = await db
      .select()
      .from(debts)
      .where(and(eq(debts.id, id), or(eq(debts.userId, userId), isNull(debts.userId))))
      .limit(1);

    if (existing.length === 0) {
      return reply.status(404).send({ error: 'Debt record not found' });
    }

    const debt = existing[0];

    await db
      .update(debts)
      .set({
        isPaid: false,
        remainingAmount: debt.totalAmount,
      })
      .where(eq(debts.id, id));

    return { success: true, isPaid: false, remainingAmount: debt.totalAmount };
  });

  fastify.delete('/api/debts/:id', async (request, reply) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };
    await db
      .delete(debts)
      .where(and(eq(debts.id, id), or(eq(debts.userId, userId), isNull(debts.userId))));
    return { success: true };
  });
}
