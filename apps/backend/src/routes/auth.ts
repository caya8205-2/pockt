import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { db } from '../db/index.js';
import { users, sessions } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { cryptoNative } from '../utils/id.js';
import { authKey, isRateLimited, recordAttempt, clearAttempts, retryAfterSec } from '../utils/rate-limit.js';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

function sessionExpiry(): string {
  return new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
}

async function issueSession(reply: any, userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await db.insert(sessions).values({
    id: token,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: sessionExpiry(),
  });

  reply.setCookie('pockt_session', token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return token;
}

export async function authRoutes(fastify: FastifyInstance) {
  // Check auth status
  fastify.get('/api/auth/me', async (request, reply) => {
    // 1. Check if database has any registered user
    const userList = await db.select().from(users).limit(1);
    if (userList.length === 0) {
      return reply.status(200).send({ authenticated: false, needsSetup: true });
    }

    // 2. Check session cookie
    const token = request.cookies.pockt_session;
    if (!token) {
      return reply.status(200).send({ authenticated: false, needsSetup: false });
    }

    // 3. Validate session exists, is unexpired, and belongs to a real user
    const session = await db.select().from(sessions).where(eq(sessions.id, token)).limit(1);
    if (session.length === 0 || new Date(session[0].expiresAt).getTime() <= Date.now()) {
      if (session.length > 0) {
        await db.delete(sessions).where(eq(sessions.id, token));
      }
      return reply.status(200).send({ authenticated: false, needsSetup: false });
    }

    const sessionUser = await db.select().from(users).where(eq(users.id, session[0].userId)).limit(1);
    if (sessionUser.length === 0) {
      return reply.status(200).send({ authenticated: false, needsSetup: false });
    }

    return reply.status(200).send({ authenticated: true, user: { username: sessionUser[0].username } });
  });

  // Initial setup / registration (single-owner app: only allowed before the first user exists)
  const handleRegister = async (request: any, reply: any) => {
    const key = authKey(request);

    if (isRateLimited(key)) {
      return reply
        .status(429)
        .header('Retry-After', String(retryAfterSec(key)))
        .send({ error: 'Terlalu banyak percobaan. Coba lagi nanti.', retryAfter: retryAfterSec(key) });
    }
    recordAttempt(key);

    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      return reply.status(403).send({ error: 'Setup sudah selesai' });
    }

    const { username, password } = loginSchema.parse(request.body);

    const duplicate = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (duplicate.length > 0) {
      return reply.status(400).send({ error: 'Username sudah digunakan' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = cryptoNative();

    await db.insert(users).values({
      id: userId,
      username,
      passwordHash,
      createdAt: new Date().toISOString(),
    });

    clearAttempts(key);
    return reply.status(200).send({ success: true, message: 'User created successfully' });
  };

  fastify.post('/api/auth/setup', handleRegister);
  fastify.post('/api/auth/register', handleRegister);

  // Login
  fastify.post('/api/auth/login', async (request, reply) => {
    const key = authKey(request);

    if (isRateLimited(key)) {
      return reply
        .status(429)
        .header('Retry-After', String(retryAfterSec(key)))
        .send({ error: 'Terlalu banyak percobaan. Coba lagi nanti.', retryAfter: retryAfterSec(key) });
    }
    recordAttempt(key);

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

    clearAttempts(key);
    await issueSession(reply, user.id);

    return reply.status(200).send({ success: true, user: { username: user.username } });
  });

  // Logout (invalidates the session server-side)
  fastify.post('/api/auth/logout', async (request, reply) => {
    const token = request.cookies.pockt_session;
    if (token) {
      await db.delete(sessions).where(eq(sessions.id, token));
    }
    reply.clearCookie('pockt_session', { path: '/' });
    return reply.status(200).send({ success: true });
  });
}
