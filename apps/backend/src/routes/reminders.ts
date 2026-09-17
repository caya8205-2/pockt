import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { bills, debts } from '../db/schema.js';
import { eq, or, isNull } from 'drizzle-orm';
import { autoResetBills, getNextMonthCycle } from '../utils/billCycle.js';

function getUserId(request: any): string {
  return request.userId || 'default';
}

function formatCountdown(diffDays: number): string {
  if (diffDays === 0) return 'Hari ini!';
  if (diffDays === 1) return 'Besok (1 hari lagi)';
  if (diffDays > 1) return `${diffDays} hari lagi`;
  return `Lewat jatuh tempo (${Math.abs(diffDays)} hari lalu)`;
}

export async function reminderRoutes(fastify: FastifyInstance) {
  fastify.get('/api/reminders/upcoming', async (request) => {
    const userId = getUserId(request);
    const query = request.query as { days?: string } | undefined;
    const daysAhead = query?.days ? Math.max(0, parseInt(query.days, 10) || 3) : 3;

    await autoResetBills(userId);

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Unpaid Bills
    const allBills = await db
      .select()
      .from(bills)
      .where(or(eq(bills.userId, userId), isNull(bills.userId)));

    const unpaidBills = allBills.filter((b) => !b.isPaid);
    const upcomingBills: Array<{
      id: string;
      name: string;
      amount: number;
      remainingAmount: number;
      dueDateDay: number;
      targetDate: string;
      daysRemaining: number;
      countdownText: string;
      notes: string | null;
    }> = [];

    for (const b of unpaidBills) {
      // For an unpaid bill in the current month cycle, the due date is this month's due date
      const currentMonthDueDate = new Date(now.getFullYear(), now.getMonth(), b.dueDate);
      const diffDays = Math.round((currentMonthDueDate.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

      // Include if within range [0..daysAhead] or overdue (up to 31 days overdue in current cycle)
      if (diffDays <= daysAhead && diffDays >= -31) {
        const yyyy = currentMonthDueDate.getFullYear();
        const mm = String(currentMonthDueDate.getMonth() + 1).padStart(2, '0');
        const dd = String(currentMonthDueDate.getDate()).padStart(2, '0');

        upcomingBills.push({
          id: b.id,
          name: b.name,
          amount: b.amount,
          remainingAmount: b.remainingAmount ?? b.amount,
          dueDateDay: b.dueDate,
          targetDate: `${yyyy}-${mm}-${dd}`,
          daysRemaining: diffDays,
          countdownText: formatCountdown(diffDays),
          notes: b.notes,
        });
      }
    }

    // Also check paid bills whose next cycle due date is approaching (within daysAhead)
    const paidBills = allBills.filter((b) => b.isPaid);
    const nextCycle = getNextMonthCycle(now);
    for (const b of paidBills) {
      const paidCycle = b.lastPaidCycle || (b.lastPaidAt ? b.lastPaidAt.slice(0, 7) : null);
      // Only if not already paid early for next month
      if (paidCycle !== nextCycle) {
        const nextMonthDueDate = new Date(now.getFullYear(), now.getMonth() + 1, b.dueDate);
        const diffDays = Math.round((nextMonthDueDate.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= daysAhead && diffDays >= 0) {
          const yyyy = nextMonthDueDate.getFullYear();
          const mm = String(nextMonthDueDate.getMonth() + 1).padStart(2, '0');
          const dd = String(nextMonthDueDate.getDate()).padStart(2, '0');

          upcomingBills.push({
            id: b.id,
            name: b.name,
            amount: b.amount,
            remainingAmount: b.amount,
            dueDateDay: b.dueDate,
            targetDate: `${yyyy}-${mm}-${dd}`,
            daysRemaining: diffDays,
            countdownText: formatCountdown(diffDays),
            notes: b.notes,
          });
        }
      }
    }

    // Sort bills by closest due date
    upcomingBills.sort((a, b) => a.daysRemaining - b.daysRemaining);

    // 2. Unpaid Debts with dueDate
    const allDebts = await db
      .select()
      .from(debts)
      .where(or(eq(debts.userId, userId), isNull(debts.userId)));

    const unpaidDebts = allDebts.filter((d) => !d.isPaid && d.dueDate);
    const upcomingDebts: Array<{
      id: string;
      person: string;
      totalAmount: number;
      remainingAmount: number;
      dueDate: string;
      daysRemaining: number;
      countdownText: string;
      notes: string | null;
    }> = [];

    for (const d of unpaidDebts) {
      if (!d.dueDate) continue;
      const targetDate = new Date(`${d.dueDate}T00:00:00`);
      const diffDays = Math.round((targetDate.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

      // Include if within range [0..daysAhead] or overdue by up to 7 days
      if (diffDays <= daysAhead && diffDays >= -7) {
        upcomingDebts.push({
          id: d.id,
          person: d.person,
          totalAmount: d.totalAmount,
          remainingAmount: d.remainingAmount,
          dueDate: d.dueDate,
          daysRemaining: diffDays,
          countdownText: formatCountdown(diffDays),
          notes: d.notes,
        });
      }
    }

    // Sort debts by closest due date
    upcomingDebts.sort((a, b) => a.daysRemaining - b.daysRemaining);

    const totalCount = upcomingBills.length + upcomingDebts.length;

    return {
      daysAhead,
      totalCount,
      upcomingBills,
      upcomingDebts,
    };
  });
}
