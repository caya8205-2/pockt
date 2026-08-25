import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { bills, debts } from '../db/schema.js';
import { eq, or, isNull } from 'drizzle-orm';

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
      // Find candidate due dates: current month and next month
      const currentMonthDueDate = new Date(now.getFullYear(), now.getMonth(), b.dueDate);
      const nextMonthDueDate = new Date(now.getFullYear(), now.getMonth() + 1, b.dueDate);

      let targetDueDate = currentMonthDueDate;
      let diffDays = Math.round((currentMonthDueDate.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

      // If current month due date has already passed by more than 3 days, check next month
      if (diffDays < -3) {
        targetDueDate = nextMonthDueDate;
        diffDays = Math.round((nextMonthDueDate.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Include if within range [0..daysAhead] or overdue by up to 3 days
      if (diffDays <= daysAhead && diffDays >= -3) {
        const yyyy = targetDueDate.getFullYear();
        const mm = String(targetDueDate.getMonth() + 1).padStart(2, '0');
        const dd = String(targetDueDate.getDate()).padStart(2, '0');

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
