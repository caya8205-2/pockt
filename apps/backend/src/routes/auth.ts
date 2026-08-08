import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { cryptoNative } from '../utils/id.js';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Check auth status
  fastify.get('/api/auth/me', async (request, reply) => {
    // 1. Check if database has any registered owner user
    const userList = await db.select().from(users).limit(1);
    if (userList.length === 0) {
      return reply.status(200).send({ authenticated: false, needsSetup: true });
    }

    // 2. Check session cookie
    const sessionId = request.cookies.pockt_session;
    if (!sessionId) {
      return reply.status(200).send({ authenticated: false, needsSetup: false });
    }

    return reply.status(200).send({ authenticated: true, user: { username: userList[0].username } });
  });

  // Initial Setup / Register first admin
  fastify.post('/api/auth/setup', async (request, reply) => {
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      return reply.status(400).send({ error: 'System already set up' });
    }

    const { username, password } = loginSchema.parse(request.body);
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = cryptoNative();

    await db.insert(users).values({
      id: userId,
      username,
      passwordHash,
      createdAt: new Date().toISOString(),
    });

    reply.setCookie('pockt_session', userId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return reply.status(200).send({ success: true, message: 'Initial user created' });
  });

  // Login
  fastify.post('/api/auth/login', async (request, reply) => {
    const { username, password } = loginSchema.parse(request.body);
    const userList = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (userList.length === 0) {
      return reply.status(401).send({ error: 'Username atau password salah' });
    }

    const user = userList[0];
    const match = await bcrypt.compare(password, user.passwordHash);

    if (!match) {
      return reply.status(401).send({ error: 'Username atau password salah' });
    }

    reply.setCookie('pockt_session', user.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    return reply.status(200).send({ success: true, user: { username: user.username } });
  });

  // Logout
  fastify.post('/api/auth/logout', async (request, reply) => {
    reply.clearCookie('pockt_session', { path: '/' });
    return reply.status(200).send({ success: true });
  });
}
