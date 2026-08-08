import { describe, it, expect, beforeAll } from 'vitest';
import { buildApp } from '../src/app.js';
import type { FastifyInstance } from 'fastify';

describe('Pockt Full Backend API Suite', () => {
  let app: FastifyInstance;
  let cookies: { pockt_session?: string } = {};

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Setup initial owner user if not exists (setup does not issue a session cookie)
    await app.inject({
      method: 'POST',
      url: '/api/auth/setup',
      payload: { username: 'owner', password: 'password123' },
    });

    // Always login as owner to obtain a session cookie
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'owner', password: 'password123' },
    });
    expect(loginRes.statusCode).toBe(200);
    const cookieHeader = loginRes.cookies.find((c) => c.name === 'pockt_session');
    if (cookieHeader) cookies = { pockt_session: cookieHeader.value };
  });

  it('GET /api/health - returns 200 OK', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
  });

  it('GET /api/auth/me - returns auth status', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/auth/me', cookies });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.authenticated).toBe(true);
  });

  it('GET /api/dashboard - calculates Free to Spend correctly', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/dashboard', cookies });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(typeof body.currentBalance).toBe('number');
    expect(typeof body.freeToSpend).toBe('number');
    expect(typeof body.outstandingBills).toBe('number');
    expect(typeof body.outstandingDebt).toBe('number');
    expect(body.freeToSpend).toBe(body.currentBalance - body.outstandingBills - body.outstandingDebt);
  });

  it('GET /api/payday - provides salary allocation analysis', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/payday', cookies });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(typeof body.salaryReceived).toBe('number');
    expect(Array.isArray(body.unpaidBills)).toBe(true);
    expect(Array.isArray(body.unpaidDebts)).toBe(true);
  });

  it('GET /api/timeline - returns combined chronological cashflow feed', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/timeline', cookies });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
  });

  it('Incomes CRUD - POST, GET, PUT, DELETE', async () => {
    // 1. Create income
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/incomes',
      cookies,
      payload: {
        title: 'Test Bonus High',
        amount: 2500000,
        date: '2026-08-08',
        notes: 'Integration Test Dummy',
      },
    });
    expect(createRes.statusCode).toBe(201);
    const created = JSON.parse(createRes.body);
    expect(created.title).toBe('Test Bonus High');
    expect(created.amount).toBe(2500000);

    // 2. Read incomes
    const getRes = await app.inject({ method: 'GET', url: '/api/incomes', cookies });
    expect(getRes.statusCode).toBe(200);
    const incomes = JSON.parse(getRes.body);
    const found = incomes.find((i: any) => i.id === created.id);
    expect(found).toBeDefined();

    // 3. Update income
    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/incomes/${created.id}`,
      cookies,
      payload: {
        title: 'Updated Test Bonus',
        amount: 3000000,
        date: '2026-08-08',
        notes: 'Updated dummy note',
      },
    });
    expect(updateRes.statusCode).toBe(200);
    const updated = JSON.parse(updateRes.body);
    expect(updated.success).toBe(true);

    // 4. Delete income
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/incomes/${created.id}`,
      cookies,
    });
    expect(deleteRes.statusCode).toBe(200);
  });

  it('Expenses CRUD - POST, GET, PUT, DELETE', async () => {
    // 1. Create expense
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/expenses',
      cookies,
      payload: {
        title: 'Makan Malam Test Dummy',
        amount: 85000,
        category: 'Makanan & Minuman',
        date: '2026-08-08',
        notes: 'UAT Test Item',
      },
    });
    expect(createRes.statusCode).toBe(201);
    const created = JSON.parse(createRes.body);
    expect(created.title).toBe('Makan Malam Test Dummy');

    // 2. Read expenses list
    const getRes = await app.inject({ method: 'GET', url: '/api/expenses', cookies });
    expect(getRes.statusCode).toBe(200);
    const expenses = JSON.parse(getRes.body);
    expect(Array.isArray(expenses)).toBe(true);
    const found = expenses.find((e: any) => e.id === created.id);
    expect(found).toBeDefined();

    // 3. Update expense
    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/expenses/${created.id}`,
      cookies,
      payload: {
        title: 'Makan Malam Fine Dining',
        amount: 120000,
        category: 'Makanan & Minuman',
        date: '2026-08-08',
        notes: 'Updated',
      },
    });
    expect(updateRes.statusCode).toBe(200);

    // 4. Delete expense
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/expenses/${created.id}`,
      cookies,
    });
    expect(deleteRes.statusCode).toBe(200);
  });

  it('Categories - GET defaults + POST custom category', async () => {
    // 1. GET categories (defaults or stored list)
    const getRes = await app.inject({ method: 'GET', url: '/api/categories', cookies });
    expect(getRes.statusCode).toBe(200);
    const categories = JSON.parse(getRes.body);
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);

    // 2. POST custom category (dummy data)
    const uniqueName = `Kategori E2E ${Date.now()}`;
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/categories',
      cookies,
      payload: { name: uniqueName, color: '#123456' },
    });
    expect(createRes.statusCode).toBe(201);
    const created = JSON.parse(createRes.body);
    expect(created.name).toBe(uniqueName);
    expect(created.color).toBe('#123456');

    // 3. GET again - custom category should be present
    const getRes2 = await app.inject({ method: 'GET', url: '/api/categories', cookies });
    const categories2 = JSON.parse(getRes2.body);
    expect(categories2.some((c: any) => c.name === uniqueName)).toBe(true);
  });

  it('Bills CRUD & Toggle Paid - POST, GET, toggle-paid, reset-monthly', async () => {
    // 1. Create bill
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/bills',
      cookies,
      payload: {
        name: 'Langganan Streaming Test',
        amount: 150000,
        dueDate: 15,
        notes: 'Test Bill Item',
      },
    });
    expect(createRes.statusCode).toBe(201);
    const bill = JSON.parse(createRes.body);
    expect(bill.isPaid).toBe(false);

    // 2. Read bills list
    const getRes = await app.inject({ method: 'GET', url: '/api/bills', cookies });
    expect(getRes.statusCode).toBe(200);
    const bills = JSON.parse(getRes.body);
    expect(Array.isArray(bills)).toBe(true);
    expect(bills.find((b: any) => b.id === bill.id)).toBeDefined();

    // 3. Update bill
    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/bills/${bill.id}`,
      cookies,
      payload: { name: 'Langganan Streaming Test Edited', amount: 200000, dueDate: 20 },
    });
    expect(updateRes.statusCode).toBe(200);

    // 4. Toggle paid status
    const toggleRes = await app.inject({
      method: 'POST',
      url: `/api/bills/${bill.id}/toggle-paid`,
      cookies,
    });
    expect(toggleRes.statusCode).toBe(200);
    const toggled = JSON.parse(toggleRes.body);
    expect(toggled.isPaid).toBe(true);

    // 5. Reset monthly bills
    const resetRes = await app.inject({
      method: 'POST',
      url: '/api/bills/reset-monthly',
      cookies,
    });
    expect(resetRes.statusCode).toBe(200);

    // 6. Delete bill
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/bills/${bill.id}`,
      cookies,
    });
    expect(deleteRes.statusCode).toBe(200);
  });

  it('Debts CRUD & Installment Payments - POST, GET, pay, payments, DELETE', async () => {
    // 1. Create debt
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/debts',
      cookies,
      payload: {
        person: 'Kawan Test Dummy',
        totalAmount: 1000000,
        dueDate: '2026-12-31',
        notes: 'Pinjaman UAT',
      },
    });
    expect(createRes.statusCode).toBe(201);
    const debt = JSON.parse(createRes.body);
    expect(debt.remainingAmount).toBe(1000000);

    // 2. Read debts list
    const getRes = await app.inject({ method: 'GET', url: '/api/debts', cookies });
    expect(getRes.statusCode).toBe(200);
    const debts = JSON.parse(getRes.body);
    expect(Array.isArray(debts)).toBe(true);
    expect(debts.find((d: any) => d.id === debt.id)).toBeDefined();

    // 3. Update debt (top-up total amount, remaining should follow)
    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/debts/${debt.id}`,
      cookies,
      payload: {
        person: 'Kawan Test Dummy',
        totalAmount: 1500000,
        dueDate: '2026-12-31',
        notes: 'Pinjaman UAT',
      },
    });
    expect(updateRes.statusCode).toBe(200);

    // 4. Pay installment
    const payRes = await app.inject({
      method: 'POST',
      url: `/api/debts/${debt.id}/pay`,
      cookies,
      payload: {
        amount: 400000,
        date: '2026-08-08',
        notes: 'Angsuran 1',
      },
    });
    expect(payRes.statusCode).toBe(200);
    const updatedDebt = JSON.parse(payRes.body);
    expect(updatedDebt.remainingAmount).toBe(1100000);

    // 5. Get payments history
    const paymentsRes = await app.inject({
      method: 'GET',
      url: `/api/debts/${debt.id}/payments`,
      cookies,
    });
    expect(paymentsRes.statusCode).toBe(200);
    const payments = JSON.parse(paymentsRes.body);
    expect(payments.length).toBe(1);
    expect(payments[0].amount).toBe(400000);

    // 6. Delete debt
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/debts/${debt.id}`,
      cookies,
    });
    expect(deleteRes.statusCode).toBe(200);
  });

  it('GET /api/export/csv - exports database tables to CSV format', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/export/csv', cookies });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.body).toContain('Type,ID,Title/Name,Amount,Category,Date,Notes');
  });

  it('Auth - register new user, duplicate rejected, login, logout', async () => {
    const uniqueUsername = `testuser_${Date.now()}`;

    // 1. Register new user (dummy data)
    const registerRes = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { username: uniqueUsername, password: 'dummypass123' },
    });
    expect(registerRes.statusCode).toBe(200);
    expect(JSON.parse(registerRes.body).success).toBe(true);

    // 2. Duplicate username rejected
    const dupRes = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { username: uniqueUsername, password: 'dummypass123' },
    });
    expect(dupRes.statusCode).toBe(400);

    // 3. Login as new user
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: uniqueUsername, password: 'dummypass123' },
    });
    expect(loginRes.statusCode).toBe(200);
    const newCookies = { pockt_session: loginRes.cookies.find((c) => c.name === 'pockt_session')!.value };

    // 4. /me with valid session
    const meRes = await app.inject({ method: 'GET', url: '/api/auth/me', cookies: newCookies });
    expect(meRes.statusCode).toBe(200);
    expect(JSON.parse(meRes.body).authenticated).toBe(true);

    // 5. Logout clears the session cookie
    const logoutRes = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      cookies: newCookies,
    });
    expect(logoutRes.statusCode).toBe(200);
    const setCookieHeader = logoutRes.headers['set-cookie'];
    expect(setCookieHeader).toBeDefined();
    expect(setCookieHeader).toContain('pockt_session=;');

    // 6. /me without session cookie - not authenticated
    const meAfter = await app.inject({ method: 'GET', url: '/api/auth/me' });
    expect(JSON.parse(meAfter.body).authenticated).toBe(false);
  });

});
