import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { initDb, db } from './db/index.js';
import { users } from './db/schema.js';
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

  // Auth Protection Hook: Protect all /api/* routes except /api/health and /api/auth/*
  app.addHook('onRequest', async (request, reply) => {
    const url = request.url;
    if (url.startsWith('/api/health') || url.startsWith('/api/auth/')) {
      return;
    }

    const userList = await db.select().from(users).limit(1);
    if (userList.length === 0) {
      return reply.status(401).send({ authenticated: false, needsSetup: true, error: 'Initial setup required' });
    }

    const sessionId = request.cookies.pockt_session;
    if (!sessionId) {
      return reply.status(401).send({ authenticated: false, needsSetup: false, error: 'Authentication required' });
    }
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
