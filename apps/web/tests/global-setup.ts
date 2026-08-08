import { request } from '@playwright/test';
import type { APIRequestContext, APIResponse } from '@playwright/test';

const API_BASE = 'http://localhost:3001';
const OWNER = { username: 'owner', password: 'password123' };

export default async function globalSetup() {
  const req = await request.newContext({ baseURL: API_BASE });
  try {
    const me = await (await req.get('/api/auth/me')).json();

    if (me.needsSetup) {
      const setupRes = await req.post('/api/auth/setup', { data: OWNER });
      if (!setupRes.ok()) {
        throw new Error(`E2E setup: failed to create owner account (HTTP ${setupRes.status()})`);
      }
      console.log('🌱 E2E: owner account created.');
    }

    const loginRes = await req.post('/api/auth/login', { data: OWNER });
    if (!loginRes.ok()) {
      throw new Error(
        'E2E requires an owner account with username "owner" and password "password123" in the dev database. ' +
          'Reset it via `pnpm user` or set it up through the app before running e2e tests.'
      );
    }

    const cookie = extractSessionCookie(loginRes);
    if (cookie) {
      await seedDummyDataIfEmpty(req, cookie);
    }
  } finally {
    await req.dispose();
  }
}

function extractSessionCookie(res: APIResponse): string | null {
  const setCookie = res.headers()['set-cookie'];
  if (!setCookie) return null;
  const match = setCookie.match(/pockt_session=([^;]+)/);
  return match ? `pockt_session=${match[1]}` : null;
}

async function seedDummyDataIfEmpty(req: APIRequestContext, cookie: string) {
  const headers = { cookie };
  const endpoints = ['/api/incomes', '/api/expenses', '/api/bills', '/api/debts'] as const;
  const responses = await Promise.all(endpoints.map((e) => req.get(e, { headers })));
  const isEmpty = await Promise.all(
    responses.map(async (res) => res.ok() && (await res.json()).length === 0)
  );

  if (!isEmpty.every(Boolean)) {
    console.log('🌱 E2E: database already has data, skipping dummy seeding.');
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  await req.post('/api/incomes', {
    headers,
    data: { title: 'Gaji Bulanan E2E', amount: 8500000, date: today, notes: 'Seeded by e2e global setup' },
  });
  await req.post('/api/expenses', {
    headers,
    data: { title: 'Makan Siang E2E', amount: 35000, category: 'Makanan & Minuman', date: today, notes: 'Seeded by e2e global setup' },
  });
  await req.post('/api/bills', {
    headers,
    data: { name: 'Internet E2E', amount: 380000, dueDate: 15, notes: 'Seeded by e2e global setup' },
  });
  await req.post('/api/debts', {
    headers,
    data: { person: 'Kawan E2E', totalAmount: 1000000, dueDate: `${new Date().getFullYear()}-12-31`, notes: 'Seeded by e2e global setup' },
  });

  console.log('🌱 E2E: dummy data seeded (income, expense, bill, debt).');
}
