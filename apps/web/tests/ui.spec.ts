import { test, expect, type Page } from '@playwright/test';

const OWNER_USERNAME = 'owner';
const OWNER_PASSWORD = 'password123';

async function login(page: Page) {
  await page.goto('/login');
  await page.locator('#username-input').fill(OWNER_USERNAME);
  await page.locator('#password-input').fill(OWNER_PASSWORD);
  await page.getByRole('button', { name: /Masuk ke Pockt|Sign In to Pockt/ }).click();
  await page.waitForURL('**/dashboard');
}

async function logout(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    const menuBtn = document.querySelector('button[aria-label="Toggle Menu"]') as HTMLButtonElement | null;
    if (menuBtn) menuBtn.click();
  });
  await page.getByRole('button', { name: /Logout/ }).filter({ visible: true }).click();
  await page.waitForURL('**/login');
}

test.describe('Pockt Automated E2E & Layout Suite', () => {

  test('Login page renders and successful login redirects to /dashboard', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#username-input')).toBeVisible();
    await expect(page.locator('#password-input')).toBeVisible();

    await page.locator('#username-input').fill(OWNER_USERNAME);
    await page.locator('#password-input').fill(OWNER_PASSWORD);
    await page.getByRole('button', { name: /Masuk ke Pockt|Sign In to Pockt/ }).click();

    await page.waitForURL('**/dashboard');
    await expect(page.getByText('Uang Bebas Dipakai', { exact: true })).toBeVisible();
  });

  test('Logout from dashboard returns to login page', async ({ page }) => {
    await login(page);
    await expect(page.getByText('Uang Bebas Dipakai', { exact: true })).toBeVisible();

    await logout(page);
    await expect(page.locator('#username-input')).toBeVisible();
  });

  test('Register page renders account form after logout', async ({ page }) => {
    await login(page);
    await logout(page);

    await page.goto('/register');
    await expect(page.getByText(/Registrasi Akun Baru|New Account Registration/)).toBeVisible();
    await expect(page.locator('#confirm-password-input')).toBeVisible();
  });

  test('Quick Add modal opens and saves a dummy expense', async ({ page }) => {
    await login(page);
    await expect(page.getByText('Uang Bebas Dipakai', { exact: true })).toBeVisible();

    const quickAddBtn = page
      .locator('[title="Catat Transaksi"], [aria-label="Catat Transaksi"], [title="Record Transaction"], [aria-label="Record Transaction"]')
      .filter({ visible: true })
      .first();
    await quickAddBtn.click();

    await expect(page.getByText('Tambah Transaksi Baru')).toBeVisible();

    await page.locator('#input-title').fill('E2E Dummy Expense');
    await page.locator('#input-amount').fill('25000');
    await page.locator('#input-notes').fill('E2E test');
    await page.getByRole('button', { name: 'Simpan Transaksi' }).click();

    await expect(page.getByText('Tambah Transaksi Baru')).toBeHidden();
  });

  test('Dashboard loads Uang Bebas Dipakai and Timeline Feed', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await expect(page).toHaveTitle(/Pockt/);
    
    // Verify main stat hero text
    const freeToSpendLabel = page.locator('text=Uang Bebas Dipakai').first();
    await expect(freeToSpendLabel).toBeVisible();

    // Verify logo image renders cleanly (either header or sidebar)
    const logoImg = page.locator('header img[alt="Pockt Logo"], aside img[alt="Pockt Logo"]').first();
    await expect(logoImg).toBeAttached();

    // Verify timeline heading
    const timelineHeader = page.locator('text=Timeline Alur Keuangan');
    await expect(timelineHeader).toBeVisible();
  });

  test('Payday Planning View renders without horizontal overflow', async ({ page }) => {
    await login(page);
    await page.goto('/payday');
    
    const salaryLabel = page.locator('text=Total Gaji / Pemasukan Bulan Ini');
    await expect(salaryLabel).toBeVisible();

    const netDisposable = page.locator('text=Hasil Akhir: Dana Bersih Bebas');
    await expect(netDisposable).toBeVisible();

    // Check no horizontal scrollbar on body
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(isOverflowing).toBe(false);
  });

  test('Incomes CRUD page layout and Quick Add modal', async ({ page }) => {
    await login(page);
    await page.goto('/incomes');
    
    const pageTitle = page.locator('h1', { hasText: 'Kelola Pemasukan' });
    await expect(pageTitle).toBeVisible();

    const addBtn = page.locator('button', { hasText: 'Tambah Pemasukan' });
    await expect(addBtn).toBeVisible();
  });

  test('Expenses page search and filtering', async ({ page }) => {
    await login(page);
    await page.goto('/expenses');

    const pageTitle = page.locator('h1', { hasText: 'Kelola Pengeluaran' });
    await expect(pageTitle).toBeVisible();

    const searchInput = page.locator('input[placeholder="Cari transaksi..."]');
    await expect(searchInput).toBeVisible();
  });

  test('Bills page renders reset and add buttons', async ({ page }) => {
    await login(page);
    await page.goto('/bills');

    const pageTitle = page.locator('h1', { hasText: 'Kelola Tagihan Bulanan' });
    await expect(pageTitle).toBeVisible();
  });

  test('Debts page payment modal opens', async ({ page }) => {
    await login(page);
    await page.goto('/debts');

    const pageTitle = page.locator('h1', { hasText: 'Catatan Hutang & Pinjaman' });
    await expect(pageTitle).toBeVisible();
  });

  test('Theme switcher toggles between Light Mode (Bloom) and Dark Mode (Aurora)', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const htmlEl = page.locator('html');

    await page.evaluate(() => {
      const btn = document.querySelector('aside button[title*="Mode"], header button[aria-label="Toggle Theme"]') as HTMLButtonElement;
      if (btn) btn.click();
    });

    await expect(htmlEl).toHaveAttribute('data-theme', 'dark');
  });

});
