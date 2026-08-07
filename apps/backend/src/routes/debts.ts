import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { debts, debtPayments } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { cryptoNative } from '../utils/id.js';

const debtSchema = z.object({
  person: z.string().min(1),
  totalAmount: z.number().positive(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional().nullable(),
});

export async function debtRoutes(fastify: FastifyInstance) {
  fastify.get('/api/debts', async () => {
    const list = await db.select().from(debts).orderBy(desc(debts.createdAt));
    return list;
  });

  fastify.post('/api/debts', async (request, reply) => {
    const body = debtSchema.parse(request.body);
    const id = cryptoNative();
    const newItem = {
      id,
      person: body.person,
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
    const { id } = request.params as { id: string };
    const body = debtSchema.parse(request.body);

    const existing = await db.select().from(debts).where(eq(debts.id, id)).limit(1);
    if (existing.length === 0) {
      return reply.status(404).send({ error: 'Debt record not found' });
    }

    const current = existing[0];
    const diff = body.totalAmount - current.totalAmount;
    const newRemaining = Math.max(0, current.remainingAmount + diff);
    const isPaid = newRemaining === 0;

    await db.update(debts).set({
      person: body.person,
      totalAmount: body.totalAmount,
      remainingAmount: newRemaining,
      dueDate: body.dueDate || null,
      isPaid: isPaid,
      notes: body.notes || null,
    }).where(eq(debts.id, id));

    return { success: true };
  });

  fastify.post('/api/debts/:id/pay', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = paymentSchema.parse(request.body);

    const existing = await db.select().from(debts).where(eq(debts.id, id)).limit(1);
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
      debtId: id,
      amount: body.amount,
      date: body.date,
      notes: body.notes || null,
      createdAt: new Date().toISOString(),
    });

    // Update debt remaining amount & paid status
    await db.update(debts).set({
      remainingAmount: newRemaining,
      isPaid: isPaid,
    }).where(eq(debts.id, id));

    return { success: true, remainingAmount: newRemaining, isPaid };
  });

  fastify.get('/api/debts/:id/payments', async (request, reply) => {
    const { id } = request.params as { id: string };
    const payments = await db.select().from(debtPayments).where(eq(debtPayments.debtId, id)).orderBy(desc(debtPayments.date));
    return payments;
  });

  fastify.delete('/api/debts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.delete(debts).where(eq(debts.id, id));
    return { success: true };
  });
}
