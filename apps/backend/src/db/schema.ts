import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  name: text('name').notNull(),
  color: text('color').notNull().default('#64748b'),
  createdAt: text('created_at').notNull(),
});

export const incomes = sqliteTable('incomes', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  title: text('title').notNull(),
  amount: real('amount').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  title: text('title').notNull(),
  amount: real('amount').notNull(),
  category: text('category').notNull().default('Umum'),
  date: text('date').notNull(), // YYYY-MM-DD
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

export const bills = sqliteTable('bills', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  dueDate: integer('due_date').notNull(), // Day of month 1-31
  isPaid: integer('is_paid', { mode: 'boolean' }).notNull().default(false),
  notes: text('notes'),
  lastPaidAt: text('last_paid_at'),
  createdAt: text('created_at').notNull(),
});

export const debts = sqliteTable('debts', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  person: text('person').notNull(),
  totalAmount: real('total_amount').notNull(),
  remainingAmount: real('remaining_amount').notNull(),
  dueDate: text('due_date'), // YYYY-MM-DD
  isPaid: integer('is_paid', { mode: 'boolean' }).notNull().default(false),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

export const debtPayments = sqliteTable('debt_payments', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  debtId: text('debt_id').notNull().references(() => debts.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});
