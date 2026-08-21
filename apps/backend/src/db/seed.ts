import { initDb, db } from './index.js';
import { users, incomes, expenses, bills, billPayments, debts, debtPayments, categories, sessions } from './schema.js';
import { cryptoNative } from '../utils/id.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🧹 Cleaning dev database...');
  initDb();

  // 1. Clean dev database
  await db.delete(sessions);
  await db.delete(debtPayments);
  await db.delete(billPayments);
  await db.delete(debts);
  await db.delete(bills);
  await db.delete(expenses);
  await db.delete(incomes);
  await db.delete(categories);
  await db.delete(users);

  console.log('🌱 Seeding comprehensive case study data for Pockt...');

  // 2. Create Default Owner User
  const userId = cryptoNative();
  const passwordHash = await bcrypt.hash('demo12345', 10);
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = (day: number) => `${y}-${m}-${String(Math.min(Math.max(day, 1), 28)).padStart(2, '0')}`;

  await db.insert(users).values({
    id: userId,
    username: 'demo',
    passwordHash,
    paydayDate: 25,
    createdAt: now.toISOString(),
  });

  // 3. Categories
  const cats = [
    { id: cryptoNative(), userId, name: 'Makanan & Minuman', color: '#f59e0b', createdAt: now.toISOString() },
    { id: cryptoNative(), userId, name: 'Transportasi', color: '#3b82f6', createdAt: now.toISOString() },
    { id: cryptoNative(), userId, name: 'Belanja & Kebutuhan', color: '#ec4899', createdAt: now.toISOString() },
    { id: cryptoNative(), userId, name: 'Hiburan & Langganan', color: '#8b5cf6', createdAt: now.toISOString() },
    { id: cryptoNative(), userId, name: 'Kesehatan & Kebugaran', color: '#10b981', createdAt: now.toISOString() },
    { id: cryptoNative(), userId, name: 'Pendidikan & Tools', color: '#06b6d4', createdAt: now.toISOString() },
    { id: cryptoNative(), userId, name: 'Lainnya', color: '#64748b', createdAt: now.toISOString() },
  ];

  for (const c of cats) {
    await db.insert(categories).values(c);
  }

  // 4. Incomes
  await db.insert(incomes).values([
    {
      id: cryptoNative(),
      userId,
      title: 'Gaji Bulanan Utama (Tech Lead / Dev)',
      amount: 14500000,
      date: d(1),
      notes: 'Transfer payroll bulanan',
      createdAt: now.toISOString(),
    },
    {
      id: cryptoNative(),
      userId,
      title: 'Freelance Project (Fullstack Web App)',
      amount: 5200000,
      date: d(8),
      notes: 'Pelunasan milestone 2 deliverable',
      createdAt: now.toISOString(),
    },
    {
      id: cryptoNative(),
      userId,
      title: 'Dividen & Imbal Hasil Reksadana',
      amount: 750000,
      date: d(15),
      notes: 'Yield bulanan portofolio investasi',
      createdAt: now.toISOString(),
    },
    {
      id: cryptoNative(),
      userId,
      title: 'Konsultasi Arsitektur Software',
      amount: 2000000,
      date: d(18),
      notes: '1-on-1 advisory & system review',
      createdAt: now.toISOString(),
    },
  ]);

  // 5. Daily Expenses
  await db.insert(expenses).values([
    {
      id: cryptoNative(),
      userId,
      title: 'Artisan Coffee & Croissant',
      amount: 58000,
      category: 'Makanan & Minuman',
      date: d(now.getDate()),
      notes: 'Morning deep work session',
      createdAt: now.toISOString(),
    },
    {
      id: cryptoNative(),
      userId,
      title: 'Makan Siang Nasi Padang Komplit',
      amount: 35000,
      category: 'Makanan & Minuman',
      date: d(now.getDate()),
      notes: 'Rendang + perkedel + es teh manis',
      createdAt: now.toISOString(),
    },
    {
      id: cryptoNative(),
      userId,
      title: 'Bensin Pertamax Turbo Full Tank',
      amount: 150000,
      category: 'Transportasi',
      date: d(Math.max(1, now.getDate() - 1)),
      notes: 'Pengisian rutin SPBU',
      createdAt: now.toISOString(),
    },
    {
      id: cryptoNative(),
      userId,
      title: 'Belanja Mingguan Supermarket',
      amount: 485000,
      category: 'Belanja & Kebutuhan',
      date: d(Math.max(1, now.getDate() - 2)),
      notes: 'Bahan masakan, susu oat, buah & cemilan sehat',
      createdAt: now.toISOString(),
    },
    {
      id: cryptoNative(),
      userId,
      title: 'Dinner Japanese Ramen & Gyoza',
      amount: 135000,
      category: 'Makanan & Minuman',
      date: d(Math.max(1, now.getDate() - 3)),
      notes: 'Makan malam akhir pekan',
      createdAt: now.toISOString(),
    },
    {
      id: cryptoNative(),
      userId,
      title: 'Top Up Saldo E-Toll & KRL Commuter',
      amount: 100000,
      category: 'Transportasi',
      date: d(Math.max(1, now.getDate() - 4)),
      notes: 'Saldo transportasi mingguan',
      createdAt: now.toISOString(),
    },
    {
      id: cryptoNative(),
      userId,
      title: 'Steam Summer Sale Game Pass',
      amount: 165000,
      category: 'Hiburan & Langganan',
      date: d(Math.max(1, now.getDate() - 5)),
      notes: 'Indie game weekend release',
      createdAt: now.toISOString(),
    },
    {
      id: cryptoNative(),
      userId,
      title: 'Gym Monthly Pass & Suplemen Whey',
      amount: 380000,
      category: 'Kesehatan & Kebugaran',
      date: d(Math.max(1, now.getDate() - 6)),
      notes: 'Membership gym & isolat protein',
      createdAt: now.toISOString(),
    },
    {
      id: cryptoNative(),
      userId,
      title: 'Domain & Cloud VPS Staging Renewal',
      amount: 195000,
      category: 'Pendidikan & Tools',
      date: d(Math.max(1, now.getDate() - 8)),
      notes: 'Server deployment personal projects',
      createdAt: now.toISOString(),
    },
    {
      id: cryptoNative(),
      userId,
      title: 'Laundry Express Kiloan',
      amount: 45000,
      category: 'Belanja & Kebutuhan',
      date: d(Math.max(1, now.getDate() - 10)),
      notes: 'Cuci & setrika rapi 5kg',
      createdAt: now.toISOString(),
    },
  ]);

  // 6. Bills & Payments
  const billStudioId = cryptoNative();
  const billBiznetId = cryptoNative();
  const billListrikId = cryptoNative();
  const billSpotifyId = cryptoNative();
  const billAsuransiId = cryptoNative();

  await db.insert(bills).values([
    {
      id: billStudioId,
      userId,
      name: 'Sewa Studio Apartemen / Kost Eksklusif',
      amount: 2750000,
      remainingAmount: 0,
      dueDate: 5,
      isPaid: true,
      notes: 'Transfer via BCA Virtual Account',
      lastPaidAt: d(5),
      createdAt: now.toISOString(),
    },
    {
      id: billBiznetId,
      userId,
      name: 'Internet Fiber Biznet 100 Mbps',
      amount: 416250,
      remainingAmount: 416250,
      dueDate: 15,
      isPaid: false,
      notes: 'Tagihan internet rumah / studio bulanan',
      lastPaidAt: null,
      createdAt: now.toISOString(),
    },
    {
      id: billListrikId,
      userId,
      name: 'Listrik PLN Pascabayar',
      amount: 520000,
      remainingAmount: 520000,
      dueDate: 20,
      isPaid: false,
      notes: 'ID Pelanggan: 5210-9823-4120',
      lastPaidAt: null,
      createdAt: now.toISOString(),
    },
    {
      id: billSpotifyId,
      userId,
      name: 'Spotify Family & Apple One Subscription',
      amount: 165000,
      remainingAmount: 0,
      dueDate: 28,
      isPaid: true,
      notes: 'Auto debit kartu kredit',
      lastPaidAt: d(28),
      createdAt: now.toISOString(),
    },
    {
      id: billAsuransiId,
      userId,
      name: 'Premi Asuransi Kesehatan Pribadi',
      amount: 650000,
      remainingAmount: 650000,
      dueDate: 10,
      isPaid: false,
      notes: 'Polis rawat inap & proteksi kesehatan',
      lastPaidAt: null,
      createdAt: now.toISOString(),
    },
  ]);

  // Recorded payments for paid bills
  await db.insert(billPayments).values([
    {
      id: cryptoNative(),
      userId,
      billId: billStudioId,
      amount: 2750000,
      date: d(5),
      notes: 'Pelunasan sewa studio',
      createdAt: now.toISOString(),
    },
    {
      id: cryptoNative(),
      userId,
      billId: billSpotifyId,
      amount: 165000,
      date: d(28),
      notes: 'Auto-debit langganan',
      createdAt: now.toISOString(),
    },
  ]);

  // 7. Debts & Payments
  const debtSonyId = cryptoNative();
  const debtDellId = cryptoNative();

  await db.insert(debts).values([
    {
      id: debtSonyId,
      userId,
      person: 'Budi (Pinjaman Lensa Kamera Sony G-Master)',
      totalAmount: 2500000,
      remainingAmount: 1000000,
      dueDate: `${y}-12-30`,
      isPaid: false,
      notes: 'Pinjaman untuk event fotografi project',
      createdAt: now.toISOString(),
    },
    {
      id: debtDellId,
      userId,
      person: 'Cicilan Workstation Monitor Dell UltraSharp 4K',
      totalAmount: 6000000,
      remainingAmount: 2000000,
      dueDate: `${y}-${m}-25`,
      isPaid: false,
      notes: 'Cicilan 3x perlengkapan setup kerja',
      createdAt: now.toISOString(),
    },
  ]);

  // Recorded payments for installments
  await db.insert(debtPayments).values([
    {
      id: cryptoNative(),
      userId,
      debtId: debtSonyId,
      amount: 1500000,
      date: d(2),
      notes: 'Cicilan pertama lensa kamera',
      createdAt: now.toISOString(),
    },
    {
      id: cryptoNative(),
      userId,
      debtId: debtDellId,
      amount: 4000000,
      date: d(12),
      notes: 'Cicilan 1 & 2 monitor 4K',
      createdAt: now.toISOString(),
    },
  ]);

  console.log('✅ Dev database cleaned and seeded successfully!');
  console.log(`\n🔑 Demo Credentials:`);
  console.log(`   Username: demo`);
  console.log(`   Password: demo12345\n`);
}

seed().catch(console.error);

