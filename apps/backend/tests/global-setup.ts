import { rmSync } from 'node:fs';

export default function globalSetup() {
  for (const file of ['pockt.test.db', 'pockt.test.db-wal', 'pockt.test.db-shm']) {
    rmSync(file, { force: true });
  }
}
