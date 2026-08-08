# Current Status & Release Tracker

This document tracks all implemented features, bug fixes, patches, and current system status for Pockt, categorized by release version and date.

## Release: v0.1.1 (2026-08-08) — Current

### Status: Security hardening complete, deployed & verified in production

- **Backend tests (Vitest)**: 17/17 passing on isolated `pockt.test.db`
- **E2E (Playwright)**: 33/33 passing across 3 viewports (Desktop Chrome, Pixel 5, iPhone 12)
- **Svelte-check**: 0 errors / 0 warnings; backend `tsc` build OK
- **Production**: containers rebuilt & live in Docker (WSL); `sessions` table auto-added to prod DB (user data intact); login / 401 / rate-limit / backup verified through the web proxy
- **Repo**: `main` @ `aabed0e`, tags `v0.1.0` (→ `d68bb7c`) & `v0.1.1`, GitHub releases created; remote `github.com/caya8205-2/pockt.git`; working tree clean

### Implemented (v0.1.1 — Security Hardening)

| Area | Detail |
| --- | --- |
| Sessions | Random 256-bit token in new `sessions` table (30-day expiry); every protected request validated against DB; logout deletes the row (server-side invalidation) |
| Rate limiting | 10 attempts / 15 min per IP on login/setup/register; 429 + Retry-After; honors `CF-Connecting-IP` behind Cloudflare Tunnel |
| Cookie | `HttpOnly` + `SameSite=Lax` + `Secure` (production), 30-day maxAge |
| Registration lock | `/api/auth/register` + `/api/auth/setup` rejected (403) once owner exists — single-owner app |
| Fail-closed secret | Backend refuses to boot in production with missing/placeholder `COOKIE_SECRET` |
| CORS | Same-origin only (`origin: false`) |
| Auth hook | Sets `request.userId` from validated session; all 8 route files read that instead of trusting the cookie |
| Backup | `pnpm --filter @pockt/backend backup` — WAL-safe SQLite snapshot into `backups/`, keeps last 14, dist-based (runs in container) |
| Tests | 12 → 17 backend tests (opaque session, invalidation, expiry cleanup, invalid session 401, registration lock, brute-force 429, fail-closed boot) |

### Key files (v0.1.1)

- `apps/backend/src/routes/auth.ts` (sessions, rate limit, secure cookie, registration lock)
- `apps/backend/src/app.ts` (session validation hook, CORS `origin:false`, fail-closed secret)
- `apps/backend/src/utils/rate-limit.ts`, `apps/backend/src/db/path.ts`, `apps/backend/src/scripts/backup.ts`
- `apps/backend/src/db/schema.ts` + `db/index.ts` (new `sessions` table)
- `apps/backend/tests/api.test.ts` (17 tests)

## Release: v0.1.0 (2026-08-08) — Full Feature Set

### Status: Released & deployed

Complete commit history (chronological), all pushed to `main`:

| Commit | What it delivered |
| --- | --- |
| `3fd54cb` | Initial MVP: light theme base |
| `fec4391` | Aurora dark mode, mobile responsiveness, full test suite, MIT license |
| `a2937d4` | README fixes |
| `be9ecd2` | Docker self-hosting (backend + web), SvelteKit Node adapter, Cloudflare Tunnel setup, Caddyfile example |
| `6d0831a` | Owner authentication, clean login UI, bilingual language toggle (ID/EN) |
| `07ebefe` | CLI user command (`pnpm --filter @pockt/backend user`) — create/reset owner |
| `ca7a427` | `/api/auth/me` returns HTTP 200 with `needsSetup` payload |
| `98e66ee` | Split dedicated `/register` + `/login` routes |
| `7c24fe4` | Multi-tenant `user_id` isolation across all tables & endpoints |
| `f46788b` | Redirect user to `/login` after successful registration |
| `a1c8394` | Full bilingual UI (every page/modal/label), dashboard polish, expanded test suite |
| `4d05564` | Localize remaining ID strings (`Uang Bebas Dipakai`, `Hari Gajian`, `Hasil Akhir: Dana Bersih Bebas`) + expense category labels (`expenseCategoryLabels` in i18n.ts) |
| `0464765` | Dev/prod/test DB separation (`pockt.dev.db` / `pockt.prod.db` / `pockt.test.db` via `DATABASE_URL`), fixed broken `db:migrate`, cleaned stray DB files |
| `630efc5` | `.env.example` |
| `d68bb7c` | Server-side `/api` proxy (`apps/web/src/routes/api/[...path]/+server.ts`, `API_INTERNAL_URL`), prod DB in `pockt-db-data` volume, `COOKIE_SECRET` via `.env` |
| `7d4379a` | Security hardening (see v0.1.1 table) |
| `aabed0e` | CURRENT_STATUS docs |

### App features (all live)

Dashboard (Free to Spend, timeline feed), Payday planning view, Incomes, Expenses (search/filter/custom categories), Bills (monthly reset, toggle paid), Debts (installments + history), Quick Add modal, CSV export (`/api/export/csv`), Bloom (light) / Aurora (dark) themes, ID/EN toggle persisted in `localStorage('pockt-lang')`.

## Operational Notes (for the main agent)

### Dev / test workflow

```bash
pnpm --filter @pockt/backend dev      # backend :3001
pnpm --filter @pockt/web dev          # web :5173 (vite proxies /api → 3001 in dev)
pnpm --filter @pockt/backend test     # 17 vitest tests, wipes pockt.test.db
pnpm --filter @pockt/web check        # svelte-check
pnpm --filter @pockt/web exec playwright test   # 33 e2e (needs backend dev on 3001)
```

### Production (Docker in WSL — run from /mnt/c/Users/Caya/Desktop/Project/pockt)

```bash
docker compose up -d --build          # rebuild + deploy
docker compose logs -f pockt-backend  # logs
docker exec pockt-backend pnpm --filter @pockt/backend backup   # snapshot → data/backups/
docker cp pockt-backend:/app/apps/backend/data/backups/pockt-<ts>.db <local-path>  # copy out
```

- Containers: `pockt-backend` (3001, internal only) + `pockt-web` (3000, tunnel entry)
- Cloudflare Tunnel (`config.yml`) routes everything → `localhost:3000`; web proxies `/api` server-side to `http://pockt-backend:3001`
- Prod DB: `/app/apps/backend/data/pockt.prod.db` inside `pockt-db-data` volume (WAL mode — copying ONLY the main file yields empty/invalid copy; always copy the backup snapshot or all three `-db/-wal/-shm` files)
- `.env` (gitignored) holds real `COOKIE_SECRET`; compose fallback placeholder is rejected by fail-closed check
- Dev/test DBs live at repo root / `apps/backend`; prod DB only inside the volume

### Gotchas

- Backend dev server on 3001 must be running for e2e; start hidden via `Start-Process cmd /c "pnpm --filter @pockt/backend dev > backend-dev.log 2>&1"` (log is gitignored now)
- Prod has 2 users in `users` table (pre-existing); app is single-owner by design — registration is locked
- v0.1.1 invalidated all pre-existing browser sessions (cookie was raw user ID before); user signed in once more after deploy
- E2E id-mode assertions use `'Uang Bebas Dipakai'` (exact), `'Hasil Akhir: Dana Bersih Bebas'`, `'Tambah Transaksi Baru'`, `'Simpan Transaksi'`, `'Total Gaji / Pemasukan Bulan Ini'`

### Suggested next goals (not yet built)

- Automated backup schedule (cron/host job calling the backup script)
- Dashboard charts (from PRD), offline/PWA support, desktop app (Tauri) — PRD `PRD.md`
