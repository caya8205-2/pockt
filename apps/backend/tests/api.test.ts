import { describe, it, expect, beforeAll } from 'vitest';
import { buildApp } from '../src/app.js';
import type { FastifyInstance } from 'fastify';

describe('Pockt Full Backend API Suite', () => {
  let app: FastifyInstance;
  let cookies: { pockt_session?: string } = {};

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Setup initial owner user if not exists
    const setupRes = await app.inject({
      method: 'POST',
      url: '/api/auth/setup',
      payload: { username: 'owner', password: 'password123' },
    });

    if (setupRes.statusCode === 200 || setupRes.statusCode === 201) {
      const cookieHeader = setupRes.cookies.find((c) => c.name === 'pockt_session');
      if (cookieHeader) cookies = { pockt_session: cookieHeader.value };
    } else {
      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { username: 'owner', password: 'password123' },
      });
      const cookieHeader = loginRes.cookies.find((c) => c.name === 'pockt_session');
      if (cookieHeader) cookies = { pockt_session: cookieHeader.value };
    }
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

    // 2. Update expense
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

    // 3. Delete expense
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/expenses/${created.id}`,
      cookies,
    });
    expect(deleteRes.statusCode).toBe(200);
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

    // 2. Toggle paid status
    const toggleRes = await app.inject({
      method: 'POST',
      url: `/api/bills/${bill.id}/toggle-paid`,
      cookies,
    });
    expect(toggleRes.statusCode).toBe(200);
    const toggled = JSON.parse(toggleRes.body);
    expect(toggled.isPaid).toBe(true);

    // 3. Reset monthly bills
    const resetRes = await app.inject({
      method: 'POST',
      url: '/api/bills/reset-monthly',
      cookies,
    });
    expect(resetRes.statusCode).toBe(200);

    // 4. Delete bill
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

    // 2. Pay installment
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
    expect(updatedDebt.remainingAmount).toBe(600000);

    // 3. Get payments history
    const paymentsRes = await app.inject({
      method: 'GET',
      url: `/api/debts/${debt.id}/payments`,
      cookies,
    });
    expect(paymentsRes.statusCode).toBe(200);
    const payments = JSON.parse(paymentsRes.body);
    expect(payments.length).toBe(1);
    expect(payments[0].amount).toBe(400000);

    // 4. Delete debt
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

});
