# Current Status & Release Tracker

This document tracks all implemented features, bug fixes, patches, and current system status for Pockt, categorized by release version and date.

## Release: v0.1.1 (2026-08-08) — Current

### Status: Security hardening complete, deployed

Full security hardening pass shipped, verified, and deployed to production:

- **Backend tests (Vitest)**: 17/17 passing on isolated `pockt.test.db`
- **E2E (Playwright)**: 33/33 passing across 3 viewports (Desktop Chrome, Pixel 5, iPhone 12)
- **Svelte-check**: 0 errors / 0 warnings
- **Production build**: succeeds for backend; containers rebuilt & live in Docker (WSL)
- **Prod verification**: `sessions` table auto-added to `pockt.prod.db` (user data intact), login/401/rate-limit verified through the web proxy, backup script writes into the volume (`/app/apps/backend/data/backups/`)

### Implemented

| Area | Detail |
| --- | --- |
| Sessions | Random 256-bit token in new `sessions` table (30-day expiry); every protected request validated against DB; logout deletes the row (server-side invalidation) |
| Rate limiting | 10 attempts / 15 min per IP on login/setup/register; 429 + Retry-After; honors `CF-Connecting-IP` behind Cloudflare Tunnel |
| Cookie | `HttpOnly` + `SameSite=Lax` + `Secure` (production), 30-day maxAge |
| Registration lock | `/api/auth/register` + `/api/auth/setup` rejected (403) once owner exists — single-owner app |
| Fail-closed secret | Backend refuses to boot in production with missing/placeholder `COOKIE_SECRET` |
| CORS | Same-origin only (`origin: false`) |
| Backup | `pnpm --filter @pockt/backend backup` — WAL-safe SQLite snapshot into `backups/`, keeps last 14, works in container (dist-based) |
| Tests | 12 → 17 backend tests (opaque session, invalidation, expiry cleanup, invalid session 401, registration lock, brute-force 429, fail-closed boot) |

### Notes

- Existing browser sessions (pre-v0.1.1 cookies = raw user ID) are invalidated by the new session model — user signs in once more.
- Dev servers on 3001/5173 stopped after verification.

## Release: v0.1.0 (2026-08-08)

### Status: Released (tag `v0.1.0`, then force-updated to `d68bb7c` with self-hosting fixes)

- i18n (ID/EN) on every page, DB dev/prod/test separation, server-side /api proxy for Docker, DB persistence in `pockt-db-data` volume, COOKIE_SECRET via `.env`
- Backend 12/12, E2E 33/33, svelte-check clean
- Pushed `main`, tags `v0.1.0`/`v0.1.1`, GitHub releases created
