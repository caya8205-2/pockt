import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { bills } from '../db/schema.js';
import { eq, asc, and, or, isNull } from 'drizzle-orm';
import { cryptoNative } from '../utils/id.js';

const billSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  dueDate: z.number().int().min(1).max(31),
  notes: z.string().optional().nullable(),
});

function getUserId(request: any): string {
  return request.userId || 'default';
}

export async function billRoutes(fastify: FastifyInstance) {
  fastify.get('/api/bills', async (request) => {
    const userId = getUserId(request);
    const list = await db
      .select()
      .from(bills)
      .where(or(eq(bills.userId, userId), isNull(bills.userId)))
      .orderBy(asc(bills.dueDate));
    return list;
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
      dueDate: body.dueDate,
      isPaid: false,
      notes: body.notes || null,
      lastPaidAt: null,
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

    await db
      .update(bills)
      .set({
        name: body.name,
        amount: body.amount,
        dueDate: body.dueDate,
        notes: body.notes || null,
      })
      .where(eq(bills.id, id));

    return { success: true };
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
    const lastPaidAt = nextIsPaid ? new Date().toISOString() : null;

    await db
      .update(bills)
      .set({
        isPaid: nextIsPaid,
        lastPaidAt: lastPaidAt,
      })
      .where(eq(bills.id, id));

    return { success: true, isPaid: nextIsPaid };
  });

  fastify.post('/api/bills/reset-monthly', async (request) => {
    const userId = getUserId(request);
    // Reset all bills paid status to false for a new billing cycle for this user
    await db
      .update(bills)
      .set({ isPaid: false })
      .where(or(eq(bills.userId, userId), isNull(bills.userId)));

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
