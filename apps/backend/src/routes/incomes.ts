import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { incomes } from '../db/schema.js';
import { eq, desc, and, or, isNull } from 'drizzle-orm';
import { cryptoNative } from '../utils/id.js';

const incomeSchema = z.object({
  title: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional().nullable(),
});

function getUserId(request: any): string {
  return request.cookies.pockt_session || 'default';
}

export async function incomeRoutes(fastify: FastifyInstance) {
  fastify.get('/api/incomes', async (request) => {
    const userId = getUserId(request);
    const list = await db
      .select()
      .from(incomes)
      .where(or(eq(incomes.userId, userId), isNull(incomes.userId)))
      .orderBy(desc(incomes.date), desc(incomes.createdAt));
    return list;
  });

  fastify.post('/api/incomes', async (request, reply) => {
    const userId = getUserId(request);
    const body = incomeSchema.parse(request.body);
    const id = cryptoNative();
    const newItem = {
      id,
      userId,
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
    const userId = getUserId(request);
    const { id } = request.params as { id: string };
    const body = incomeSchema.parse(request.body);

    const existing = await db
      .select()
      .from(incomes)
      .where(and(eq(incomes.id, id), or(eq(incomes.userId, userId), isNull(incomes.userId))))
      .limit(1);

    if (existing.length === 0) {
      return reply.status(404).send({ error: 'Income not found' });
    }

    await db
      .update(incomes)
      .set({
        title: body.title,
        amount: body.amount,
        date: body.date,
        notes: body.notes || null,
      })
      .where(eq(incomes.id, id));

    return { success: true };
  });

  fastify.delete('/api/incomes/:id', async (request, reply) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };
    await db
      .delete(incomes)
      .where(and(eq(incomes.id, id), or(eq(incomes.userId, userId), isNull(incomes.userId))));
    return { success: true };
  });
}
