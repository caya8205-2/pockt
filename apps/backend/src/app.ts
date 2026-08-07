import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { initDb } from './db/index.js';
import { authRoutes } from './routes/auth.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { incomeRoutes } from './routes/incomes.js';
import { expenseRoutes } from './routes/expenses.js';
import { billRoutes } from './routes/bills.js';
import { debtRoutes } from './routes/debts.js';
import { timelineRoutes } from './routes/timeline.js';
import { paydayRoutes } from './routes/payday.js';
import { backupRoutes } from './routes/backup.js';

export async function buildApp() {
  const app = Fastify({ logger: false });

  // Initialize SQLite tables
  initDb();

  // Register plugins
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'pockt-secret-key-321',
  });

  // Register API routes
  await app.register(authRoutes);
  await app.register(dashboardRoutes);
  await app.register(incomeRoutes);
  await app.register(expenseRoutes);
  await app.register(billRoutes);
  await app.register(debtRoutes);
  await app.register(timelineRoutes);
  await app.register(paydayRoutes);
  await app.register(backupRoutes);

  app.get('/api/health', async () => {
    return { status: 'ok', name: 'Pockt API', time: new Date().toISOString() };
  });

  return app;
}
