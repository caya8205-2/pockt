import { initDb, db } from './index.js';
import { incomes, expenses, bills, debts, categories } from './schema.js';
import { cryptoNative } from '../utils/id.js';

async function seed() {
  console.log('🌱 Seeding sample data for Pockt...');
  initDb();

  // Categories
  const cats = [
    { id: '1', name: 'Makanan & Minuman', color: '#f59e0b', createdAt: new Date().toISOString() },
    { id: '2', name: 'Transportasi', color: '#3b82f6', createdAt: new Date().toISOString() },
    { id: '3', name: 'Belanja', color: '#ec4899', createdAt: new Date().toISOString() },
    { id: '4', name: 'Hiburan', color: '#8b5cf6', createdAt: new Date().toISOString() },
    { id: '5', name: 'Kesehatan', color: '#10b981', createdAt: new Date().toISOString() },
    { id: '6', name: 'Lainnya', color: '#64748b', createdAt: new Date().toISOString() },
  ];

  for (const c of cats) {
    try {
      await db.insert(categories).values(c);
    } catch (e) {}
  }

  const today = new Date().toISOString().split('T')[0];

  // Incomes
  await db.insert(incomes).values([
    {
      id: cryptoNative(),
      title: 'Gaji Bulanan',
      amount: 8500000,
      date: today,
      notes: 'Transfer Gaji Utama',
      createdAt: new Date().toISOString(),
    },
    {
      id: cryptoNative(),
      title: 'Project Freelance Web Design',
      amount: 2500000,
      date: today,
      notes: 'DP Project Client A',
      createdAt: new Date().toISOString(),
    },
  ]);

  // Expenses
  await db.insert(expenses).values([
    {
      id: cryptoNative(),
      title: 'Makan Siang Nasi Padang',
      amount: 35000,
      category: 'Makanan & Minuman',
      date: today,
      notes: 'Dengan es teh manis',
      createdAt: new Date().toISOString(),
    },
    {
      id: cryptoNative(),
      title: 'Bensin & Tol',
      amount: 150000,
      category: 'Transportasi',
      date: today,
      notes: 'Isi Pertamax',
      createdAt: new Date().toISOString(),
    },
    {
      id: cryptoNative(),
      title: 'Belanja Bulanan Supermarket',
      amount: 450000,
      category: 'Belanja',
      date: today,
      notes: 'Kebutuhan dapur & mandi',
      createdAt: new Date().toISOString(),
    },
  ]);

  // Bills
  await db.insert(bills).values([
    {
      id: cryptoNative(),
      name: 'Sewa Kontrakan / Apartemen',
      amount: 2000000,
      dueDate: 10,
      isPaid: false,
      notes: 'Bayar via transfer bank',
      lastPaidAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: cryptoNative(),
      name: 'Internet Indihome / Biznet',
      amount: 380000,
      dueDate: 15,
      isPaid: false,
      notes: 'Paket 50Mbps',
      lastPaidAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: cryptoNative(),
      name: 'Spotify Family Subscription',
      amount: 86000,
      dueDate: 20,
      isPaid: true,
      notes: 'Auto debit',
      lastPaidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ]);

  // Debts
  await db.insert(debts).values([
    {
      id: cryptoNative(),
      person: 'Budi (Pinjaman Kamera)',
      totalAmount: 1500000,
      remainingAmount: 1000000,
      dueDate: `${new Date().getFullYear()}-12-30`,
      isPaid: false,
      notes: 'Pinjam untuk event liputan',
      createdAt: new Date().toISOString(),
    },
  ]);

  console.log('✅ Seeding completed successfully!');
}

seed().catch(console.error);
