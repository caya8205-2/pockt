import Database from 'better-sqlite3';
import { mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { dbPath } from '../db/path.js';

const BACKUPS_TO_KEEP = 14;

async function main() {
  const backupDir = path.join(path.dirname(dbPath), 'backups');
  mkdirSync(backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(backupDir, `pockt-${stamp}.db`);

  const src = new Database(dbPath, { readonly: true });
  try {
    await (src.backup(dest) as unknown as Promise<void>);
  } finally {
    src.close();
  }

  const backups = readdirSync(backupDir).filter((f) => f.startsWith('pockt-') && f.endsWith('.db')).sort();
  while (backups.length > BACKUPS_TO_KEEP) {
    const oldest = backups.shift()!;
    unlinkSync(path.join(backupDir, oldest));
  }

  console.log(`[backup] created ${dest} (${backups.length} backups kept)`);
}

main().catch((err) => {
  console.error('[backup] failed:', err);
  process.exit(1);
});
