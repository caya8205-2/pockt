import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { initDb, db } from './db/index.js';
import { users, sessions } from './db/schema.js';
import { eq } from 'drizzle-orm';
import { authRoutes } from './routes/auth.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { incomeRoutes } from './routes/incomes.js';
import { expenseRoutes } from './routes/expenses.js';
import { billRoutes } from './routes/bills.js';
import { debtRoutes } from './routes/debts.js';
import { timelineRoutes } from './routes/timeline.js';
import { paydayRoutes } from './routes/payday.js';
import { backupRoutes } from './routes/backup.js';

const KNOWN_WEAK_SECRETS = ['pockt-secret-key-321', 'pockt-prod-secret-change-this-987'];

export async function buildApp() {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieSecret = process.env.COOKIE_SECRET;

  // Fail closed in production: never boot with a missing or known placeholder secret
  if (isProduction && (!cookieSecret || KNOWN_WEAK_SECRETS.includes(cookieSecret))) {
    throw new Error('COOKIE_SECRET must be set to a strong random value in production');
  }

  const app = Fastify({ logger: false });

  // Initialize SQLite tables
  initDb();

  // Register plugins
  await app.register(cors, {
    origin: false,
    credentials: true,
  });

  await app.register(cookie, {
    secret: cookieSecret || 'pockt-dev-secret',
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

    const token = request.cookies.pockt_session;
    if (!token) {
      return reply.status(401).send({ authenticated: false, needsSetup: false, error: 'Authentication required' });
    }

    // Validate session: must exist, be unexpired, and belong to a real user
    const session = await db.select().from(sessions).where(eq(sessions.id, token)).limit(1);
    if (session.length === 0 || new Date(session[0].expiresAt).getTime() <= Date.now()) {
      if (session.length > 0) {
        await db.delete(sessions).where(eq(sessions.id, token));
      }
      return reply.status(401).send({ authenticated: false, needsSetup: false, error: 'Session expired or invalid' });
    }

    const user = await db.select().from(users).where(eq(users.id, session[0].userId)).limit(1);
    if (user.length === 0) {
      return reply.status(401).send({ authenticated: false, needsSetup: false, error: 'Authentication required' });
    }

    (request as any).userId = user[0].id;
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
