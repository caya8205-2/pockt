import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { incomes } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { cryptoNative } from '../utils/id.js';

const incomeSchema = z.object({
  title: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional().nullable(),
});

export async function incomeRoutes(fastify: FastifyInstance) {
  fastify.get('/api/incomes', async () => {
    const list = await db.select().from(incomes).orderBy(desc(incomes.date), desc(incomes.createdAt));
    return list;
  });

  fastify.post('/api/incomes', async (request, reply) => {
    const body = incomeSchema.parse(request.body);
    const id = cryptoNative();
    const newItem = {
      id,
      title: body.title,
      amount: body.amount,
      date: body.date,
      notes: body.notes || null,
      createdAt: new Date().toISOString(),
    };
    await db.insert(incomes).values(newItem);
    return reply.status(201).send(newItem);
  });

  fastify.put('/api/incomes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = incomeSchema.parse(request.body);

    const existing = await db.select().from(incomes).where(eq(incomes.id, id)).limit(1);
    if (existing.length === 0) {
      return reply.status(404).send({ error: 'Income not found' });
    }

    await db.update(incomes).set({
      title: body.title,
      amount: body.amount,
      date: body.date,
      notes: body.notes || null,
    }).where(eq(incomes.id, id));

    return { success: true };
  });

  fastify.delete('/api/incomes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.delete(incomes).where(eq(incomes.id, id));
    return { success: true };
  });
}
