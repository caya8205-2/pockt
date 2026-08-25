import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { expenses, categories, debts } from '../db/schema.js';
import { eq, desc, and, or, isNull } from 'drizzle-orm';
import { cryptoNative } from '../utils/id.js';

const PAYLATER_METHODS = ['GOPAY_LATER', 'SPAYLATER', 'OTHER_PAYLATER'];

function isPaylaterMethod(method?: string | null, explicitIsPaylater?: boolean | null): boolean {
  if (explicitIsPaylater === true) return true;
  if (!method) return false;
  return PAYLATER_METHODS.includes(method.toUpperCase());
}

const expenseSchema = z.object({
  title: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  debtId: z.string().optional().nullable(),
  isPaylater: z.boolean().optional().nullable(),
});

const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
});

function getUserId(request: any): string {
  return request.userId || 'default';
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

async function findOrCreateMatchingPaylaterDebt(
  userId: string,
  paymentMethod: string,
  expenseDateStr: string,
  expenseAmount: number,
  expenseTitle: string
): Promise<string> {
  const methodUpper = paymentMethod.toUpperCase();
  const activeDebts = await db
    .select()
    .from(debts)
    .where(and(or(eq(debts.userId, userId), isNull(debts.userId)), eq(debts.isPaid, false)))
    .orderBy(desc(debts.createdAt));

  // 1. Try exact type match
  let matched = activeDebts.find((d) => (d.type || '').toUpperCase() === methodUpper);

  // 2. If not found by type, try keyword match on person name
  if (!matched) {
    if (methodUpper === 'GOPAY_LATER') {
      matched = activeDebts.find((d) => {
        const p = d.person.toLowerCase();
        return p.includes('gopay') || p.includes('go-pay');
      });
    } else if (methodUpper === 'SPAYLATER') {
      matched = activeDebts.find((d) => {
        const p = d.person.toLowerCase();
        return p.includes('spaylater') || p.includes('shopee') || p.includes('shopeepay');
      });
    } else if (methodUpper === 'OTHER_PAYLATER') {
      matched = activeDebts.find((d) => d.person.toLowerCase().includes('paylater'));
    }
  }

  if (matched) {
    // Accumulate to existing debt
    const newTotal = matched.totalAmount + expenseAmount;
    const newRemaining = matched.remainingAmount + expenseAmount;
    await db
      .update(debts)
      .set({
        totalAmount: newTotal,
        remainingAmount: newRemaining,
        isPaid: false,
      })
      .where(eq(debts.id, matched.id));

    return matched.id;
  }

  // 3. If no matching debt found, auto-create one
  const expDate = new Date(expenseDateStr);
  const monthName = MONTH_NAMES_ID[isNaN(expDate.getTime()) ? new Date().getMonth() : expDate.getMonth()];
  let defaultPersonName = 'Paylater';
  if (methodUpper === 'GOPAY_LATER') defaultPersonName = `Gopay Later ${monthName}`;
  else if (methodUpper === 'SPAYLATER') defaultPersonName = `Shopee Paylater ${monthName}`;
  else defaultPersonName = `Paylater ${monthName}`;

  const newDebtId = cryptoNative();
  const newDebt = {
    id: newDebtId,
    userId,
    person: defaultPersonName,
    type: methodUpper,
    totalAmount: expenseAmount,
    remainingAmount: expenseAmount,
    dueDate: null,
    isPaid: false,
    notes: `Dibuat otomatis dari transaksi ${expenseTitle}`,
    createdAt: new Date().toISOString(),
  };

  await db.insert(debts).values(newDebt);
  return newDebtId;
}

export async function expenseRoutes(fastify: FastifyInstance) {
  // Expenses CRUD
  fastify.get('/api/expenses', async (request) => {
    const userId = getUserId(request);
    const query = request.query as { debtId?: string; paymentMethod?: string } | undefined;

    let list = await db
      .select()
      .from(expenses)
      .where(or(eq(expenses.userId, userId), isNull(expenses.userId)))
      .orderBy(desc(expenses.date), desc(expenses.createdAt));

    if (query?.debtId) {
      list = list.filter((e) => e.debtId === query.debtId);
    }
    if (query?.paymentMethod) {
      list = list.filter((e) => (e.paymentMethod || '').toUpperCase() === query.paymentMethod!.toUpperCase());
    }

    return list;
  });

  fastify.post('/api/expenses', async (request, reply) => {
    const userId = getUserId(request);
    const body = expenseSchema.parse(request.body);
    const id = cryptoNative();

    const paymentMethod = body.paymentMethod || 'CASH';
    const isPaylater = isPaylaterMethod(paymentMethod, body.isPaylater);
    let debtId = body.debtId || null;

    // If Paylater and debtId not explicitly provided, auto-match or auto-create debt
    if (isPaylater && !debtId) {
      debtId = await findOrCreateMatchingPaylaterDebt(
        userId,
        paymentMethod,
        body.date,
        body.amount,
        body.title
      );
    } else if (debtId) {
      // If linked to a debt explicitly, auto-accumulate debt amount
      const debtRow = await db
        .select()
        .from(debts)
        .where(and(eq(debts.id, debtId), or(eq(debts.userId, userId), isNull(debts.userId))))
        .limit(1);

      if (debtRow.length > 0) {
        const debt = debtRow[0];
        const newTotal = debt.totalAmount + body.amount;
        const newRemaining = debt.remainingAmount + body.amount;
        await db
          .update(debts)
          .set({
            totalAmount: newTotal,
            remainingAmount: newRemaining,
            isPaid: false,
          })
          .where(eq(debts.id, debtId));
      }
    }

    const newItem = {
      id,
      userId,
      title: body.title,
      amount: body.amount,
      category: body.category,
      paymentMethod,
      debtId,
      isPaylater,
      date: body.date,
      notes: body.notes || null,
      createdAt: new Date().toISOString(),
    };

    await db.insert(expenses).values(newItem);

    return reply.status(201).send(newItem);
  });

  fastify.put('/api/expenses/:id', async (request, reply) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };
    const body = expenseSchema.parse(request.body);

    const existing = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), or(eq(expenses.userId, userId), isNull(expenses.userId))))
      .limit(1);

    if (existing.length === 0) {
      return reply.status(404).send({ error: 'Expense not found' });
    }

    const oldExpense = existing[0];
    const newPaymentMethod = body.paymentMethod ?? oldExpense.paymentMethod ?? 'CASH';
    const newIsPaylater = isPaylaterMethod(newPaymentMethod, body.isPaylater ?? oldExpense.isPaylater);
    const newDebtId = body.debtId !== undefined ? (body.debtId || null) : oldExpense.debtId;
    const newAmount = body.amount;
    const oldAmount = oldExpense.amount;

    // Handle debt adjustments on update
    if (oldExpense.debtId) {
      if (oldExpense.debtId === newDebtId) {
        // Same debt: adjust by diff
        const diff = newAmount - oldAmount;
        if (diff !== 0) {
          const debtRow = await db
            .select()
            .from(debts)
            .where(and(eq(debts.id, oldExpense.debtId), or(eq(debts.userId, userId), isNull(debts.userId))))
            .limit(1);

          if (debtRow.length > 0) {
            const newTotal = Math.max(0, debtRow[0].totalAmount + diff);
            const newRemaining = Math.max(0, debtRow[0].remainingAmount + diff);
            await db
              .update(debts)
              .set({
                totalAmount: newTotal,
                remainingAmount: newRemaining,
                isPaid: newRemaining === 0,
              })
              .where(eq(debts.id, oldExpense.debtId));
          }
        }
      } else {
        // Debt ID changed or removed: subtract old amount from old debt
        const oldDebtRow = await db
          .select()
          .from(debts)
          .where(and(eq(debts.id, oldExpense.debtId), or(eq(debts.userId, userId), isNull(debts.userId))))
          .limit(1);

        if (oldDebtRow.length > 0) {
          const newTotal = Math.max(0, oldDebtRow[0].totalAmount - oldAmount);
          const newRemaining = Math.max(0, oldDebtRow[0].remainingAmount - oldAmount);
          await db
            .update(debts)
            .set({
              totalAmount: newTotal,
              remainingAmount: newRemaining,
              isPaid: newRemaining === 0,
            })
            .where(eq(debts.id, oldExpense.debtId));
        }

        // Add new amount to new debt if set
        if (newDebtId) {
          const newDebtRow = await db
            .select()
            .from(debts)
            .where(and(eq(debts.id, newDebtId), or(eq(debts.userId, userId), isNull(debts.userId))))
            .limit(1);

          if (newDebtRow.length > 0) {
            const newTotal = newDebtRow[0].totalAmount + newAmount;
            const newRemaining = newDebtRow[0].remainingAmount + newAmount;
            await db
              .update(debts)
              .set({
                totalAmount: newTotal,
                remainingAmount: newRemaining,
                isPaid: false,
              })
              .where(eq(debts.id, newDebtId));
          }
        }
      }
    } else if (newDebtId) {
      // Previously no debt, now linked to a debt
      const newDebtRow = await db
        .select()
        .from(debts)
        .where(and(eq(debts.id, newDebtId), or(eq(debts.userId, userId), isNull(debts.userId))))
        .limit(1);

      if (newDebtRow.length > 0) {
        const newTotal = newDebtRow[0].totalAmount + newAmount;
        const newRemaining = newDebtRow[0].remainingAmount + newAmount;
        await db
          .update(debts)
          .set({
            totalAmount: newTotal,
            remainingAmount: newRemaining,
            isPaid: false,
          })
          .where(eq(debts.id, newDebtId));
      }
    }

    await db
      .update(expenses)
      .set({
        title: body.title,
        amount: body.amount,
        category: body.category,
        paymentMethod: newPaymentMethod,
        debtId: newDebtId,
        isPaylater: newIsPaylater,
        date: body.date,
        notes: body.notes || null,
      })
      .where(eq(expenses.id, id));

    return { success: true };
  });

  fastify.delete('/api/expenses/:id', async (request, reply) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };

    const existing = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), or(eq(expenses.userId, userId), isNull(expenses.userId))))
      .limit(1);

    if (existing.length === 0) {
      return reply.status(404).send({ error: 'Expense not found' });
    }

    const item = existing[0];

    // If linked to a debt, reduce debt amount
    if (item.debtId) {
      const debtRow = await db
        .select()
        .from(debts)
        .where(and(eq(debts.id, item.debtId), or(eq(debts.userId, userId), isNull(debts.userId))))
        .limit(1);

      if (debtRow.length > 0) {
        const newTotal = Math.max(0, debtRow[0].totalAmount - item.amount);
        const newRemaining = Math.max(0, debtRow[0].remainingAmount - item.amount);
        await db
          .update(debts)
          .set({
            totalAmount: newTotal,
            remainingAmount: newRemaining,
            isPaid: newRemaining === 0,
          })
          .where(eq(debts.id, item.debtId));
      }
    }

    await db
      .delete(expenses)
      .where(and(eq(expenses.id, id), or(eq(expenses.userId, userId), isNull(expenses.userId))));

    return { success: true };
  });

  // Categories CRUD
  fastify.get('/api/categories', async (request) => {
    const userId = getUserId(request);
    const list = await db
      .select()
      .from(categories)
      .where(or(eq(categories.userId, userId), isNull(categories.userId)))
      .orderBy(categories.name);

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
    const userId = getUserId(request);
    const body = categorySchema.parse(request.body);
    const id = cryptoNative();
    const newItem = {
      id,
      userId,
      name: body.name,
      color: body.color || '#64748b',
      createdAt: new Date().toISOString(),
    };
    await db.insert(categories).values(newItem);
    return reply.status(201).send(newItem);
  });
}
