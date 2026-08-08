import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { incomes, expenses, bills, debts, debtPayments, users } from '../db/schema.js';
import { desc, eq, or, isNull } from 'drizzle-orm';

function getUserId(request: any): string {
  return request.userId || 'default';
}

export function getPaydayCycleWindow(now: Date = new Date(), paydayDate: number = 5): { cycleStart: string; cycleEnd: string } {
  const validDay = Math.min(Math.max(paydayDate, 1), 31);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  let startYear: number;
  let startMonth: number;

  if (currentDate >= validDay) {
    startYear = currentYear;
    startMonth = currentMonth;
  } else {
    if (currentMonth === 0) {
      startYear = currentYear - 1;
      startMonth = 11;
    } else {
      startYear = currentYear;
      startMonth = currentMonth - 1;
    }
  }

  const maxStartDays = new Date(startYear, startMonth + 1, 0).getDate();
  const actualStartDay = Math.min(validDay, maxStartDays);
  const cycleStartObj = new Date(startYear, startMonth, actualStartDay);

  let endYear = startYear;
  let endMonth = startMonth + 1;
  if (endMonth > 11) {
    endYear = startYear + 1;
    endMonth = 0;
  }

  const maxEndDays = new Date(endYear, endMonth + 1, 0).getDate();
  const actualEndDay = Math.min(validDay, maxEndDays);
  const nextCycleStartObj = new Date(endYear, endMonth, actualEndDay);
  const cycleEndObj = new Date(nextCycleStartObj.getTime() - 86400000);

  const formatISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  return {
    cycleStart: formatISO(cycleStartObj),
    cycleEnd: formatISO(cycleEndObj),
  };
}

async function getOwnerPaydayDate(userId: string): Promise<number> {
  if (userId && userId !== 'default') {
    const userRow = await db.select({ paydayDate: users.paydayDate }).from(users).where(eq(users.id, userId)).limit(1);
    if (userRow.length > 0 && userRow[0].paydayDate !== null && userRow[0].paydayDate !== undefined) {
      return userRow[0].paydayDate;
    }
  }

  const firstUser = await db.select({ paydayDate: users.paydayDate }).from(users).limit(1);
  if (firstUser.length > 0 && firstUser[0].paydayDate !== null && firstUser[0].paydayDate !== undefined) {
    return firstUser[0].paydayDate;
  }

  return 5;
}

export async function paydayRoutes(fastify: FastifyInstance) {
  fastify.get('/api/payday', async (request) => {
    const userId = getUserId(request);

    // Fetch user's preferred payday date (default: 5)
    const queryDay = (request.query as any)?.paydayDate;
    const dbDay = await getOwnerPaydayDate(userId);
    const paydayDate = queryDay ? Number(queryDay) : dbDay;

    const now = new Date();
    const { cycleStart, cycleEnd } = getPaydayCycleWindow(now, paydayDate);

    // Main salary incomes within this payday cycle
    const allIncomes = await db
      .select()
      .from(incomes)
      .where(or(eq(incomes.userId, userId), isNull(incomes.userId)))
      .orderBy(desc(incomes.date));

    const cycleIncomes = allIncomes.filter((i) => i.date >= cycleStart && i.date <= cycleEnd);
    const totalSalaryReceived = cycleIncomes.reduce((acc, curr) => acc + curr.amount, 0);

    // Outstanding bills for this user
    const allBills = await db
      .select()
      .from(bills)
      .where(or(eq(bills.userId, userId), isNull(bills.userId)));

    const unpaidBills = allBills.filter((b) => !b.isPaid);
    const billsTotal = unpaidBills.reduce((acc, curr) => acc + (curr.remainingAmount ?? curr.amount), 0);

    // Debt repayments made THIS payday cycle
    const allDebtPayments = await db
      .select()
      .from(debtPayments)
      .where(or(eq(debtPayments.userId, userId), isNull(debtPayments.userId)));

    const cycleDebtPayments = allDebtPayments.filter((dp) => dp.date >= cycleStart && dp.date <= cycleEnd);
    const debtPaidThisMonth = cycleDebtPayments.reduce((acc, curr) => acc + curr.amount, 0);

    // Debts due within this payday cycle (or past due / no due date)
    const allDebts = await db
      .select()
      .from(debts)
      .where(or(eq(debts.userId, userId), isNull(debts.userId)));

    const unpaidDebts = allDebts.filter((d) => !d.isPaid);
    const dueDebtsThisMonth = unpaidDebts.filter((d) => {
      if (!d.dueDate) return true; // No due date = due/active
      return d.dueDate <= cycleEnd; // Due date on or before end of current payday cycle
    });

    const debtDueThisMonth = dueDebtsThisMonth.reduce((acc, curr) => acc + curr.remainingAmount, 0);

    // Expenses spent during this payday cycle
    const allExpenses = await db
      .select()
      .from(expenses)
      .where(or(eq(expenses.userId, userId), isNull(expenses.userId)));

    const cycleExpenses = allExpenses.filter((e) => e.date >= cycleStart && e.date <= cycleEnd);
    const spentTotal = cycleExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    const freeToSpend = totalSalaryReceived - billsTotal - debtPaidThisMonth - debtDueThisMonth - spentTotal;

    return {
      paydayDate,
      cycleStart,
      cycleEnd,
      salaryReceived: totalSalaryReceived,
      billsTotal,
      debtPaidThisMonth,
      debtDueThisMonth,
      debtPaidCount: cycleDebtPayments.length,
      debtDueCount: dueDebtsThisMonth.length,
      spentTotal,
      freeToSpend,
      unpaidBills,
      dueDebtsThisMonth,
      // Backward compatibility keys
      debtDueTotal: debtDueThisMonth,
      unpaidDebts: dueDebtsThisMonth,
    };
  });

  fastify.put('/api/user/settings', async (request, reply) => {
    const userId = getUserId(request);
    const { paydayDate } = request.body as { paydayDate?: number };

    if (!paydayDate || typeof paydayDate !== 'number' || paydayDate < 1 || paydayDate > 31) {
      return reply.status(400).send({ error: 'paydayDate harus berupa angka antara 1 dan 31' });
    }

    const allUsers = await db.select({ id: users.id }).from(users);
    if (allUsers.length > 0) {
      for (const u of allUsers) {
        await db.update(users).set({ paydayDate }).where(eq(users.id, u.id));
      }
    }

    return { success: true, paydayDate };
  });
}


