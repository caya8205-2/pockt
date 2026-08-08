# CURRENT STATUS & HANDOFF CONTEXT

Last Updated: 2026-08-08 (Release v0.2.1 - Custom Payday Cycle Window & Salary Date Setting)

---

## 1. Physical Host & Self-Hosting Architecture

* **Host Machine**: Windows 11 PC (Running 24/7).
* **WSL 2 Configuration (`C:\Users\Caya\.wslconfig`)**:
  ```ini
  [wsl2]
  memory=1536MB
  swap=1GB
  processors=2
  vmIdleTimeout=-1
  ```
* **Background Keep-Alive Daemon**:
  File `C:\Users\Caya\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\pockt-wsl-keepalive.vbs` executes `wsl.exe --exec sleep infinity` silently in the background on Windows startup to ensure the WSL 2 Virtual Machine is never shut down by Windows idle timeouts when terminal windows are closed.

* **Docker Containers (`docker-compose.yml`)**:
  - `pockt-web`: SvelteKit Frontend (Port `3000`, `mem_limit: 256m`).
  - `pockt-backend`: Fastify REST API + SQLite Database (Port `3002:3001`, `mem_limit: 256m`).

* **Public Ingress / Cloudflare Tunnel**:
  - Service: `cloudflared.service` (Linux systemd service inside WSL).
  - Target: `http://127.0.0.1:3000`
  - Domain: `https://pockt.caya.web.id`
  - Tunnel ID: `b079efbd-9f60-42da-8932-485df7ad037e` (`pockt-tunnel`).
  - Protocol: **TCP HTTP/2 (`--protocol http2`)**.

---

## 2. Release v0.2.1 Highlights & Recent UX Polish

- **Dynamic Payday Cycle Window**: Payday Planning (`/payday`) calculates financial totals based on user's monthly salary date (default: 5th of every month, e.g. 5 Aug – 4 Sep).
- **Eliminated Fake Free-to-Spend Illusion**: Debts/Paylater due on the 1st of next month are automatically included in the current salary cycle because they fall before the next salary arrives on the 5th.
- **Configurable Payday Date Setting**: Added `paydayDate` (1–31) user setting in SQLite DB (`users` table) with API `PUT /api/user/settings` and interactive UI modal on `/payday`.
- **Payday Cycle Badge & Error Feedback**: Displays active cycle date range in the header of `/payday` overview page with error feedback banner in payday date modal.
- **UI Button Alignment & Layout Polish**: Perfected vertical centering of `<Plus>` icons in header buttons across `/bills`, `/debts`, `/expenses`, `/incomes`, and `/payday`.
- **Expense Category Creation Fix**: Added missing i18n translation keys and fixed container width styling for inline category creation input (`showNewCatInput`).
- **Automatic Thousand Separators & Amount Preview (`AmountInput.svelte`)**: Replaced raw number fields with formatted input displaying Indonesian thousand dots (e.g., `1.500.000`), live formatted Rupiah badges (`= Rp 1.500.000`), quick zero increment buttons (`+000` Ribuan, `+000.000` Jutaan), and strict `padding-left` layout to prevent `Rp` prefix text overlap.
- **Simplified Clean Cards & Dynamic Payment Statuses**: Removed redundant top badges from `/bills` and `/debts`. Status indicators (`BELUM DIBAYAR`, `DIBAYAR SEBAGIAN (Terbayar Rp ...)`, `LUNAS`) sit directly under title/name. Due date info is placed cleanly under the status line on both `/bills` and `/debts` formatted as `Jatuh tempo: Tgl {dueDate} / bulan`.
- **Bill Payment History Modal & Full i18n**: Added `GET /api/bills/:id/payments` endpoint and interactive "Riwayat" modal for `/bills`. All status indicators, helper texts, and modal inputs are 100% responsive in both Indonesian and English.
- **Configurable Environment Variables & Proxy Targets**: Updated `vite.config.ts` and `+server.ts` to respect `VITE_BACKEND_URL` / `API_INTERNAL_URL`. Created `.env.example` templates across root, backend, and web apps to clearly isolate dev (`pockt.dev.db`) and prod (`pockt.prod.db`) environments.
- **Payday Full-Width Consistency & Dashboard Skeleton Loader**: Removed `max-w-4xl mx-auto` from `/payday` so its cards stretch full width consistently with all other tabs. Added an initial loading skeleton to `/dashboard` Hero & Stat Cards, preventing section "Timeline Alur Keuangan" from jumping to the top of the page during data load.
- **Animated Auth Transitions & Theme-Matching Loading Screens (`authTransition.ts`)**: Built a smooth fullscreen transition system for Login, Logout, and Registration. Features an animated Pockt logo gliding down from the top, pulsing softly in the center with status messages, and sliding downward off-screen to gracefully reveal target pages.

---

## 3. SOP Deployment Pipeline

Before making any commits or releasing:
1. Run Integration Tests: `pnpm --filter @pockt/backend test` (Must pass 17/17).
2. Production Deployment: `wsl docker compose up -d --build` (Use Docker build cache).
3. Push to Remote: `git push origin main`.
4. Create Release & Tag: `gh release create v0.2.x`.
