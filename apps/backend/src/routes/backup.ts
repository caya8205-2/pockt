import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { incomes, expenses, bills, debts } from '../db/schema.js';

export async function backupRoutes(fastify: FastifyInstance) {
  fastify.get('/api/export/csv', async (request, reply) => {
    const allIncomes = await db.select().from(incomes);
    const allExpenses = await db.select().from(expenses);

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
