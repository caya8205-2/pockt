import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const dbPath =
  process.env.DATABASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? path.resolve(__dirname, '../../pockt.prod.db')
    : path.resolve(__dirname, '../../pockt.dev.db'));
