# Current Status & Release Tracker

This document tracks all implemented features, bug fixes, patches, and current system status for Pockt, categorized by release version and date.

## Release: v0.1.0 (2026-08-08) — Current

### Status: Development complete, awaiting push

All session work is complete and verified:

- **Svelte-check**: 0 errors / 0 warnings
- **Backend tests (Vitest)**: 12/12 passing on isolated `pockt.test.db`
- **E2E (Playwright)**: 33/33 passing across 3 viewports (Desktop Chrome, Pixel 5, iPhone 12)
- **Production build**: succeeds for both web and backend

### Implemented

| Area | Detail |
| --- | --- |
| Authentication | Single-owner setup (`/register`), login (`/login`), cookie sessions, logout, CLI user command (`pnpm --filter @pockt/backend user`) |
| Dashboard | Moved to `/dashboard`; root `/` 307-redirects there |
| Billingual UI | ID (default) / EN toggle covering every page, modal, and label; persisted in `localStorage('pockt-lang')` |
| Core modules | Payday view, incomes, expenses, bills (monthly reset), debts (installments + history), quick add modal, CSV export, dual theme (Bloom/Aurora) |
| Testing | Isolated backend test DB, E2E global setup with owner + dummy seed |

### Repository state

- 10 commits locally; history rewritten to purge SQLite WAL/SHM artifacts
- Remote `github.com/caya8205-2/pockt.git` configured but empty — push pending
- Working tree changes (auth, dashboard move, i18n, tests, docs) staged, commit pending
