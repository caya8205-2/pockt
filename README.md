<p align="center">
  <a href="https://svelte.dev"><img src="https://img.shields.io/badge/SvelteKit-v5.0-FF3E00?style=for-the-badge&logo=svelte&logoColor=white" alt="SvelteKit" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://fastify.dev"><img src="https://img.shields.io/badge/Fastify-v5.2-000000?style=for-the-badge&logo=fastify&logoColor=white" alt="Fastify" /></a>
  <a href="https://orm.drizzle.team"><img src="https://img.shields.io/badge/Drizzle_ORM-0.40-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black" alt="Drizzle ORM" /></a>
  <a href="https://www.sqlite.org"><img src="https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="https://vitest.dev"><img src="https://img.shields.io/badge/Vitest-v3.0-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" /></a>
  <a href="https://playwright.dev"><img src="https://img.shields.io/badge/Playwright-v1.51-2EAD33?style=for-the-badge&logo=playwright&logoColor=white" alt="Playwright" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License" /></a>
</p>

<p align="center">
  <img src="apps/web/static/logo-no-bg.png" alt="Pockt Logo" width="160" />
</p>

<p align="center">
  <strong>Personal Disposable Income & Cash Flow Companion</strong>
</p>

<p align="center">
  Pockt is a high-performance, self-hosted personal finance tracker focused on answering the single most important financial question:
</p>

<blockquote align="center">
  <strong>"How much money can I safely spend today?"</strong>
</blockquote>

---

## 🌟 Key Highlights

- **Net Disposable Income Engine**: Calculates real-time spendable cash by factoring `Current Cash - Outstanding Bills - Outstanding Debts`.
- **Single-Owner Authentication**: First-time setup, cookie-based sessions, and route protection across all pages.
- **Bilingual UI (ID/EN)**: One-tap language toggle that re-renders the entire app — every page, modal, and label.
- **[Hallmark](https://www.usehallmark.com/) OKLCH Dual Theme System**:
  - **Bloom (Light)**: Warm Oat canvas `oklch(0.975 0.008 75)` with Signal Terracotta accent `oklch(0.64 0.18 40)`.
  - **Aurora (Dark)**: Obsidian Slate canvas `oklch(0.14 0.012 250)` with Teal Emerald accent `oklch(0.74 0.16 170)`.
- **Side-Rail Compact Navigation (N3 Archetype)**: Compactable sidebar with logo toggle and 100% monochrome controls.
- **2-Row Mobile-First Layout**: Guaranteed zero horizontal scrollbar or clipped content across all viewports (320px–412px+).
- **Automated Testing Suite**: Full API integration testing (Vitest) and End-to-End browser testing (Playwright).

---

## 🚀 Features

- **🔐 Single-Owner Authentication**: First-time setup flow creates the owner account; session-based login (cookie) protects all data; logout supported.
- **📊 Free-to-Spend Dashboard** (`/dashboard`): Instant visibility into net disposable income, monthly stats, and live cashflow timeline.
- **💰 Payday Allocation View** (`/payday`): Planning matrix for incoming salary vs. upcoming commitments, bills, debts, and spent totals.
- **📥 Income Tracking** (`/incomes`): Log salary, freelance work, investments, or reimbursements.
- **💸 Expense Management** (`/expenses`): Category filtering, search, and fast entry under 10 seconds.
- **📅 Monthly Bills Tracker** (`/bills`): One-click paid/unpaid toggling and automated monthly reset flow.
- **🤝 Debt & Loan Register** (`/debts`): Installment payment log, remaining balance calculations, and repayment history.
- **⚡ Quick Add Modal**: Record an expense or income from anywhere in the app in seconds.
- **🌐 Bilingual UI (Bahasa Indonesia / English)**: Full language toggle applied across every page, modal, and label, persisted to `localStorage`.
- **🎨 Dual Theme System**: Bloom (Light) and Aurora (Dark) themes with one-click switching.
- **📁 CSV Data Export**: One-click database export for offline reporting and backup.

---

## 🛠️ Tech Stack & Monorepo Architecture

```text
pockt/
├── apps/
│   ├── backend/         # Fastify 5 REST API + Drizzle ORM + SQLite + Vitest
│   └── web/             # SvelteKit 5 + Tailwind CSS v4 + Playwright E2E
├── packages/
│   └── shared/          # Shared TypeScript schemas & domain utilities
├── turbo.json           # Turborepo build orchestration
└── pnpm-workspace.yaml  # pnpm workspace configuration
```

---

## ⚙️ Development Guide

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run Development Servers
Starts frontend (`http://localhost:5173`) and backend (`http://localhost:3001`):
```bash
pnpm dev
```

### 3. Production Build
```bash
pnpm build
```

### 4. Database Files (Dev / Prod / Test Separation)

Pockt uses separate SQLite files so testing never touches your real data:

| Environment | DB file | When used |
| --- | --- | --- |
| Development | `pockt.dev.db` | `pnpm dev` (default, `NODE_ENV` not `production`) |
| Production | `pockt.prod.db` | Docker deploy / `pnpm start` with `NODE_ENV=production` |
| Backend tests | `pockt.test.db` | Vitest (wiped on every run) |

The schema auto-creates on server start; you can also run `pnpm --filter @pockt/backend db:migrate`. Override any path with the `DATABASE_URL` env var. In Docker, the prod DB lives inside the `pockt-db-data` volume, and the web container proxies `/api` to the backend via `API_INTERNAL_URL` (server-side proxy, no extra reverse proxy needed).

### 5. Owner Account (First-Time Setup)

The app asks you to create the owner account on the `/register` page when it detects no owner exists. You can also create or reset the owner via CLI:

```bash
# Create/reset owner credentials (prompts for username + password)
pnpm --filter @pockt/backend user
```

---

## 🧪 Testing Suite

Pockt includes an automated testing suite for both backend APIs and frontend UI viewports. Backend tests run against an isolated `pockt.test.db` database that is wiped on every run; E2E tests use a global setup that ensures an owner exists and seeds dummy data when empty.

```bash
# Run backend API integration tests (12 tests via Vitest, isolated test DB)
pnpm test

# Run frontend E2E layout & responsive tests (33 tests via Playwright, 3 viewports)
pnpm test:web

# Run all backend + frontend tests
pnpm test:all
```

---

## 📜 License

Distributed under the [MIT License](LICENSE).