# Changelog

All notable changes to Pockt are documented in this file. Grouped by release, with the primary release changes at the top.

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
