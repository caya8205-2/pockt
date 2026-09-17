import { db } from '../db/index.js';
import { bills } from '../db/schema.js';
import { eq, or, isNull } from 'drizzle-orm';

/**
 * Returns the cycle string formatted as YYYY-MM (e.g. "2026-09")
 */
export function getCurrentMonthCycle(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Returns the next month cycle string formatted as YYYY-MM (e.g. "2026-10")
 */
export function getNextMonthCycle(now: Date = new Date()): string {
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Automatically resets recurring bills for the current month cycle if they were paid
 * or partially settled in a previous month cycle.
 *
 * Preserves lastPaidAt for audit & historical display, but sets isPaid = false,
 * remainingAmount = amount, and resets lastPaidCycle to null.
 */
export async function autoResetBills(userId?: string, now: Date = new Date()): Promise<void> {
  const currentMonth = getCurrentMonthCycle(now);

  const query = userId
    ? db.select().from(bills).where(or(eq(bills.userId, userId), isNull(bills.userId)))
    : db.select().from(bills);

  const allBills = await query;

  for (const b of allBills) {
    const paidCycle = b.lastPaidCycle || (b.lastPaidAt ? b.lastPaidAt.slice(0, 7) : null);
    const wasPaidOrPartial = b.isPaid || (b.remainingAmount !== null && b.remainingAmount < b.amount);

    if (paidCycle && paidCycle < currentMonth && wasPaidOrPartial) {
      await db
        .update(bills)
        .set({
          isPaid: false,
          remainingAmount: b.amount,
          lastPaidCycle: null,
        })
        .where(eq(bills.id, b.id));
    }
  }
}
