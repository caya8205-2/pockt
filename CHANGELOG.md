# Changelog

All notable changes to Pockt are documented in this file. Grouped by release, with the primary release changes at the top.

## [0.2.1] — 2026-08-08

### Custom Payday Cycle Window & Setting

- **Dynamic Payday Cycle Window**: Replaced calendar-month filtering on `/payday` with custom salary cycle windows calculated from the user's monthly salary date (default: 5th of every month, e.g. Aug 5 – Sep 4).
- **Eliminated Fake Free-to-Spend Illusion**: Debts and bills due on the 1st of next month (which fall before the next salary arrives on the 5th) are now automatically included as mandatory obligations in the current salary cycle.
- **Configurable Payday Date Setting**: Added user setting `paydayDate` (1–31) in `users` table, updatable via `PUT /api/user/settings` and interactive modal on `/payday`.
- **Payday Header Cycle Badge**: Added active cycle date range display (e.g. `Payday Cycle: 5 Aug 2026 – 4 Sep 2026`) in `/payday` overview header.

### Payment Statuses, Bill History & UX Polish

- **Dynamic Payment Statuses & Clean Cards**: Added automatic status indicators across `/bills` and `/debts` (`BELUM DIBAYAR`, `DIBAYAR SEBAGIAN`, `LUNAS`). Statuses update automatically from payments made without manual toggling. Removed redundant card badges and placed status & due date info directly under item names (`Jatuh tempo: Tgl {dueDate} / bulan`).
- **Bill Payment History Modal & API Endpoint**: Added `GET /api/bills/:id/payments` Fastify backend endpoint and interactive "Riwayat" modal for `/bills`, matching installment payment history tracking on `/debts`.
- **Automatic Thousand Separator Input (`AmountInput.svelte`)**: Created reusable number input displaying live Indonesian thousand dots (`1.500.000`), live Rupiah badge (`= Rp 1.500.000`), quick zero buttons (`+000` Ribuan, `+000.000` Jutaan), and enforced `padding-left` styling to eliminate text overlap with the `Rp` prefix.
- **Full Width Layout & Dashboard Skeleton Loader**: Removed restrictive `max-w-4xl` from `/payday` to stretch cards full width. Added initial skeleton loader to `/dashboard` Hero and Stat Grid, preventing layout shift of section "Timeline Alur Keuangan".
- **Animated Auth Transitions & Theme-Matching Loading Screens (`authTransition.ts`)**: Built a smooth transition system for Login, Logout, and Register. Features an animated Pockt logo gliding down from above, pulsing softly in the center with status messages, and sliding downward off-screen to unveil target pages.
- **Isolated Dev vs Prod Database Environments**: Configured `.env.example` templates and updated `vite.config.ts` / `+server.ts` to respect `VITE_BACKEND_URL` / `API_INTERNAL_URL`. Relocated Docker container backend port to `3002:3001` so host port `3001` is reserved for local dev (`pockt.dev.db`).

## [0.2.0] — 2026-08-08

### UI Refinements & Mobile Responsive Polish

- **Removed wallet icon badge on Payday Planning**: Removed redundant wallet icon badge next to "Total Monthly Salary / Incomes" header on the `/payday` overview page.
- **Hidden left icon badge on mobile Timeline Feed**: Hid the left square icon badge on `/dashboard` timeline feed cards for mobile viewports (`hidden sm:block`) to give title and transaction amounts more horizontal breathing room.
- **Fixed Debts list mobile overflow**: Updated debt item card layout on `/debts` to responsive stacking (`flex-col sm:flex-row`), preventing text, due dates, and remaining/total amounts from overflowing or clipping on narrow mobile screens.

### Payday Planning Debt Isolation

- **Divided Payday debt obligations into 2 separate categories**:
  - `Angsuran / Hutang Dibayar Bulan Ini` (`debtPaidThisMonth`): total debt repayments executed in the current month.
  - `Sisa Hutang Jatuh Tempo Bulan Ini` (`debtDueThisMonth`): remaining debt principal due in the current month (or past due / no due date).
- **Excluded future-month debts from monthly net calculation**: Debts due in future months (e.g. November 2026, December 2026, January 2027 during August 2026) are no longer deducted from this month's Payday net income calculation (`freeToSpend`).
- **Updated `/api/payday` response endpoint**: returns `debtPaidThisMonth`, `debtDueThisMonth`, `debtPaidCount`, `debtDueCount`, and `dueDebtsThisMonth`.

## [0.1.1] — 2026-08-08

### Security Hardening

- **Opaque server-side sessions**: login now issues a random 256-bit token (previously the raw user ID) stored in a new `sessions` table with 30-day expiry. Every protected request validates the session against the DB (exists + not expired + real user); expired/invalid sessions are deleted on sight.
- **Logout invalidates sessions server-side**: the session row is deleted on logout, so a stolen cookie stops working immediately.
- **Rate limiting on auth endpoints**: login/setup/register are limited to 10 attempts per 15 minutes per IP (honors `CF-Connecting-IP` behind Cloudflare Tunnel), returning `429` + `Retry-After`. Successful logins reset the bucket.
- **Secure cookie flags**: `pockt_session` cookie is now `HttpOnly` + `SameSite=Lax` + `Secure` in production (30-day maxAge).
- **Registration locked to setup**: `/api/auth/register` and `/api/auth/setup` are rejected with `403` once the owner exists (single-owner app); previously anyone could create extra accounts.
- **Fail-closed COOKIE_SECRET**: in production the backend refuses to boot when `COOKIE_SECRET` is missing or one of the known placeholders (`pockt-secret-key-321`, `pockt-prod-secret-change-this-987`).
- **CORS same-origin only**: `origin: false` — no cross-origin API access.
- **Auth hook now sets `request.userId`** from the validated session; all route files read that instead of trusting the cookie value directly.
- **DB backup script**: `pnpm --filter @pockt/backend backup` creates a WAL-safe snapshot via the SQLite online backup API into `backups/` next to the DB file, keeping the last 14. Works inside the Docker container (`/app/apps/backend/data/backups/` in the volume).
- **Test suite expanded to 17 backend tests**: opaque-session flow, server-side invalidation after logout, expired-session cleanup, invalid-session 401, single-owner registration lock, brute-force rate limiting (10 fails → 429), and fail-closed boot without a strong secret.

> Note: existing browser sessions created before this release are invalidated — sign in once more after deploying.

## [0.1.0] — 2026-08-08

### Authentication & Security

- **Single-owner authentication**: first-time setup flow creates the owner account via `/register`; subsequent logins use `/login`.
- **Session-based auth**: username/password login returns a signed cookie (`pockt-session`) validated on every request by the backend; all financial routes are protected.
- **Route protection on the frontend**: `+layout.svelte` re-runs `checkAuth()` on every pathname change (via a reactive `lastCheckedPath` guard), so stale sessions get redirected to `/login` (or `/register` when no owner exists) immediately after navigation, not only on full page load. Login/register pages redirect authenticated users to `/dashboard`.
- **Logout endpoint** (`POST /api/auth/logout`) clears the session cookie; the UI signs out from the sidebar.
- **CLI owner management**: `pnpm --filter @pockt/backend user` creates or resets the owner credentials from the terminal.
- Passwords are hashed with bcryptjs; credentials and sessions are stored in the `users` / `sessions` tables (SQLite, via Drizzle ORM).

### Dashboard Reorganization

- Dashboard moved from the root route to `/dashboard` (`apps/web/src/routes/dashboard/+page.svelte`).
- The root `/` now performs a server-side 307 redirect (`+page.ts`) to `/dashboard`.
- All navigation items, logo links, redirects after login, and E2E assertions were updated to the new path.

### Internationalization (Bilingual UI)

- **Full i18n coverage**: the language toggle (previously only affecting the sidebar and login pages) now re-renders every page, modal, form label, placeholder, button, status badge, and error message in the app.
- Pages converted: dashboard, payday, incomes, expenses, bills, debts, Quick Add modal, and the sidebar tagline.
- Supported languages: **Bahasa Indonesia** (default, persisted) and **English**, stored in `localStorage('pockt-lang')`.
- Translation catalog lives in `apps/web/src/lib/i18n.ts` (`translations` dictionary keyed by `id` / `en`, reactive `currentLang` store + `toggleLang()`).
- Categories stored as data (e.g. "Makanan & Minuman") intentionally remain untranslated so filters and stored records stay consistent.

### Test Suite Expansion & Isolation

- **Backend (Vitest)**: now 12 tests covering register (success + duplicate), logout, categories GET/POST, list endpoints for expenses/bills/debts, and PUT updates for bills/debts.
  - Tests run against an isolated `pockt.test.db` (`apps/backend/vitest.config.ts`) that is wiped by `apps/backend/tests/global-setup.ts` on every run — the dev database is never touched.
  - Fixed `beforeAll` to always log in after setup, since setup performs no session creation.
- **E2E (Playwright)**: now 33 tests across 3 viewports (Desktop Chrome, Pixel 5, iPhone 12).
  - Added login/logout helpers; all pre-auth tests were migrated to authenticate via the login helper after auth was introduced.
  - New tests: quick-add modal, register page flow.
  - `apps/web/tests/global-setup.ts` ensures the owner exists (setup or login) and seeds dummy data (1 income, 1 expense, 1 bill, 1 debt) only when the database is empty.
- History cleanup: SQLite WAL/SHM artifacts (`pockt.db-wal`, `pockt.db-shm`) were removed from git tracking and stripped from repository history.

### Build & Tooling Fixes

- Fixed TypeScript config in `apps/web`: `module: ESNext` + `moduleResolution: bundler` — `svelte-check` now reports 0 errors and 0 warnings (was failing on import resolution).
