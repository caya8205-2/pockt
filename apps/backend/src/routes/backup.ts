import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { incomes, expenses } from '../db/schema.js';
import { eq, or, isNull } from 'drizzle-orm';

function getUserId(request: any): string {
  return request.userId || 'default';
}

export async function backupRoutes(fastify: FastifyInstance) {
  fastify.get('/api/export/csv', async (request, reply) => {
    const userId = getUserId(request);
    const allIncomes = await db
      .select()
      .from(incomes)
      .where(or(eq(incomes.userId, userId), isNull(incomes.userId)));

    const allExpenses = await db
      .select()
      .from(expenses)
      .where(or(eq(expenses.userId, userId), isNull(expenses.userId)));

    let csvContent = 'Type,ID,Title/Name,Amount,Category,Date,Notes\n';

    for (const inc of allIncomes) {
      csvContent += `Income,${inc.id},"${inc.title}",${inc.amount},Income,${inc.date},"${inc.notes || ''}"\n`;
    }

    for (const exp of allExpenses) {
      csvContent += `Expense,${exp.id},"${exp.title}",${exp.amount},"${exp.category}",${exp.date},"${exp.notes || ''}"\n`;
    }

    reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', 'attachment; filename="pockt-financial-export.csv"')
      .send(csvContent);
  });
}
