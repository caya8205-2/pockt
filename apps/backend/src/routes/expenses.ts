import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { expenses, categories } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { cryptoNative } from '../utils/id.js';

const expenseSchema = z.object({
  title: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional().nullable(),
});

const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
});

export async function expenseRoutes(fastify: FastifyInstance) {
  // Expenses CRUD
  fastify.get('/api/expenses', async () => {
    const list = await db.select().from(expenses).orderBy(desc(expenses.date), desc(expenses.createdAt));
    return list;
  });

  fastify.post('/api/expenses', async (request, reply) => {
    const body = expenseSchema.parse(request.body);
    const id = cryptoNative();
    const newItem = {
      id,
      title: body.title,
      amount: body.amount,
      category: body.category,
      date: body.date,
      notes: body.notes || null,
      createdAt: new Date().toISOString(),
    };
    await db.insert(expenses).values(newItem);
    return reply.status(201).send(newItem);
  });

  fastify.put('/api/expenses/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = expenseSchema.parse(request.body);

    const existing = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
    if (existing.length === 0) {
      return reply.status(404).send({ error: 'Expense not found' });
    }

    await db.update(expenses).set({
      title: body.title,
      amount: body.amount,
      category: body.category,
      date: body.date,
      notes: body.notes || null,
    }).where(eq(expenses.id, id));

    return { success: true };
  });

  fastify.delete('/api/expenses/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.delete(expenses).where(eq(expenses.id, id));
    return { success: true };
  });

  // Categories CRUD
  fastify.get('/api/categories', async () => {
    const list = await db.select().from(categories).orderBy(categories.name);
    if (list.length === 0) {
      // Return default categories if empty
      return [
        { id: '1', name: 'Makanan & Minuman', color: '#f59e0b' },
        { id: '2', name: 'Transportasi', color: '#3b82f6' },
        { id: '3', name: 'Belanja', color: '#ec4899' },
        { id: '4', name: 'Hiburan', color: '#8b5cf6' },
        { id: '5', name: 'Kesehatan', color: '#10b981' },
        { id: '6', name: 'Lainnya', color: '#64748b' },
      ];
    }
    return list;
  });

  fastify.post('/api/categories', async (request, reply) => {
    const body = categorySchema.parse(request.body);
    const id = cryptoNative();
    const newItem = {
      id,
      name: body.name,
      color: body.color || '#64748b',
      createdAt: new Date().toISOString(),
    };
    await db.insert(categories).values(newItem);
    return reply.status(201).send(newItem);
  });
}
