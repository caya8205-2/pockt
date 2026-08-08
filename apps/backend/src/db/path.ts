export const dbPath = process.env.DATABASE_URL || (process.env.NODE_ENV === 'production' ? 'pockt.prod.db' : 'pockt.dev.db');
