import { db, initDb } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { cryptoNative } from '../utils/id.js';
import readline from 'readline';

async function run() {
  initDb();

  const rawArgs = process.argv.slice(2);
  const isForce = rawArgs.some((arg) => arg.toLowerCase() === 'force' || arg === '--force' || arg === '-f');
  const cleanArgs = rawArgs.filter((arg) => arg.toLowerCase() !== 'force' && arg !== '--force' && arg !== '-f');

  let username = cleanArgs[0];
  let password = cleanArgs[1];

  // Interactive mode if arguments are missing
  if (!username || !password) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const question = (query: string): Promise<string> => {
      return new Promise((resolve) => rl.question(query, resolve));
    };

    console.log('\n🔐 --- CLI Pengelola Akun Pockt ---\n');
    if (!username) {
      username = await question('Masukkan Username: ');
    }
    if (!password) {
      password = await question('Masukkan Password: ');
    }
    rl.close();
  }

  username = username.trim();
  password = password.trim();

  if (!username || !password) {
    console.error('\n❌ Username dan password tidak boleh kosong.\n');
    process.exit(1);
  }

  const existingUsers = await db.select().from(users).where(eq(users.username, username)).limit(1);

  if (existingUsers.length > 0) {
    if (!isForce) {
      console.error(
        `\n❌ User '${username}' sudah terdaftar dalam sistem.\n` +
          `ℹ️  Gunakan kata 'force' dibelakang perintah untuk memperbarui password.\n` +
          `👉 Contoh: pnpm user ${username} ${password} force\n`
      );
      process.exit(1);
    }

    // Update existing user password
    const passwordHash = await bcrypt.hash(password, 10);
    await db.update(users).set({ passwordHash }).where(eq(users.username, username));

    console.log(`\n✅ Password untuk user '${username}' berhasil diperbarui dengan kata kunci 'force'!\n`);
  } else {
    // Create new user
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = cryptoNative();

    await db.insert(users).values({
      id: userId,
      username,
      passwordHash,
      createdAt: new Date().toISOString(),
    });

    console.log(`\n✅ User '${username}' berhasil dibuat! Kamu sekarang bisa login menggunakan akun ini.\n`);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Error executing user CLI:', err);
  process.exit(1);
});
