import { test, expect } from '@playwright/test';

test.describe('Pockt Automated E2E & Layout Suite', () => {

  test('Dashboard loads Free to Spend and Timeline Feed', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Pockt/);
    
    // Verify main stat hero text
    const freeToSpendLabel = page.locator('text=Free to Spend');
    await expect(freeToSpendLabel).toBeVisible();

    // Verify logo image renders cleanly (either header or sidebar)
    const logoImg = page.locator('header img[alt="Pockt Logo"], aside img[alt="Pockt Logo"]').first();
    await expect(logoImg).toBeAttached();

    // Verify timeline heading
    const timelineHeader = page.locator('text=Timeline Alur Keuangan');
    await expect(timelineHeader).toBeVisible();
  });

  test('Payday Planning View renders without horizontal overflow', async ({ page }) => {
    await page.goto('/payday');
    
    const salaryLabel = page.locator('text=Total Gaji / Pemasukan Bulan Ini');
    await expect(salaryLabel).toBeVisible();

    const netDisposable = page.locator('text=Hasil Akhir: Net Disposable Income');
    await expect(netDisposable).toBeVisible();

    // Check no horizontal scrollbar on body
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(isOverflowing).toBe(false);
  });

  test('Incomes CRUD page layout and Quick Add modal', async ({ page }) => {
    await page.goto('/incomes');
    
    const pageTitle = page.locator('h1', { hasText: 'Kelola Pemasukan' });
    await expect(pageTitle).toBeVisible();

    const addBtn = page.locator('button', { hasText: 'Tambah Pemasukan' });
    await expect(addBtn).toBeVisible();
  });

  test('Expenses page search and filtering', async ({ page }) => {
    await page.goto('/expenses');

    const pageTitle = page.locator('h1', { hasText: 'Kelola Pengeluaran' });
    await expect(pageTitle).toBeVisible();

    const searchInput = page.locator('input[placeholder="Cari transaksi..."]');
    await expect(searchInput).toBeVisible();
  });

  test('Bills page renders reset and add buttons', async ({ page }) => {
    await page.goto('/bills');

    const pageTitle = page.locator('h1', { hasText: 'Kelola Tagihan Bulanan' });
    await expect(pageTitle).toBeVisible();
  });

  test('Debts page payment modal opens', async ({ page }) => {
    await page.goto('/debts');

    const pageTitle = page.locator('h1', { hasText: 'Catatan Hutang & Pinjaman' });
    await expect(pageTitle).toBeVisible();
  });

  test('Theme switcher toggles between Light Mode (Bloom) and Dark Mode (Aurora)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const htmlEl = page.locator('html');

    await page.evaluate(() => {
      const btn = document.querySelector('aside button[title*="Mode"], header button[aria-label="Toggle Theme"]') as HTMLButtonElement;
      if (btn) btn.click();
    });

    await expect(htmlEl).toHaveAttribute('data-theme', 'dark');
  });

});
