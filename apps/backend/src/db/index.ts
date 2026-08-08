import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { dbPath } from './path.js';

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

console.log(`[db] connected to ${dbPath}`);

export const db = drizzle(sqlite, { schema });

// Helper for initial schema creation and automatic multi-tenant user_id column migrations
export function initDb() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#64748b',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS incomes (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL DEFAULT 'Umum',
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      remaining_amount REAL,
      due_date INTEGER NOT NULL,
      is_paid INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      last_paid_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bill_payments (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      bill_id TEXT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS debts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      person TEXT NOT NULL,
      total_amount REAL NOT NULL,
      remaining_amount REAL NOT NULL,
      due_date TEXT,
      is_paid INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS debt_payments (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      debt_id TEXT NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
  `);

  // Safely attempt to add user_id column to existing tables if missing
  const tables = ['categories', 'incomes', 'expenses', 'bills', 'bill_payments', 'debts', 'debt_payments'];
  for (const table of tables) {
    try {
      sqlite.exec(`ALTER TABLE ${table} ADD COLUMN user_id TEXT;`);
    } catch (e) {
      // Column user_id already exists, ignore
    }
  }

  try {
    sqlite.exec(`ALTER TABLE bills ADD COLUMN remaining_amount REAL;`);
  } catch (e) {
    // Column remaining_amount already exists, ignore
  }

  // Clean up any legacy expense rows generated from bill payments so expenses table is strictly daily expenses
  try {
    sqlite.exec(`DELETE FROM expenses WHERE category = 'Tagihan' OR title LIKE 'Pembayaran Tagihan:%';`);
  } catch (e) {
    // Ignore cleanup error if table empty
  }
}
