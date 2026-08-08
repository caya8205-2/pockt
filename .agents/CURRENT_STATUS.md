# CURRENT STATUS & HANDOFF CONTEXT

Last Updated: 2026-08-08 (Release v0.2.0 - Payday Debt Isolation & UI Responsive Improvements)

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
  - `pockt-backend`: Fastify REST API + SQLite Database (Port `3001`, `mem_limit: 256m`).

* **Public Ingress / Cloudflare Tunnel**:
  - Service: `cloudflared.service` (Linux systemd service inside WSL).
  - Target: `http://127.0.0.1:3000`
  - Domain: `https://pockt.caya.web.id`
  - Tunnel ID: `b079efbd-9f60-42da-8932-485df7ad037e` (`pockt-tunnel`).
  - Protocol: **TCP HTTP/2 (`--protocol http2`)**.

---

## 2. Release v0.2.0 Highlights

- **Removed Wallet Icon Badge on Payday Planning**: Removed redundant wallet icon badge next to "Total Monthly Salary / Incomes" header on the `/payday` overview page.
- **Hidden Timeline Feed Icon Badge on Mobile**: Hid the left square icon badge on `/dashboard` timeline feed cards for mobile viewports (`hidden sm:block`) to give title and transaction amounts maximum horizontal width.
- **Fixed Debts List Mobile Overflow**: Updated debt item card layout on `/debts` to responsive stacking (`flex-col sm:flex-row`), preventing text, due dates, and remaining/total amounts from overflowing or clipping on narrow mobile screens.
- **Payday Planning Debt Isolation**:
  - Divided Payday debt obligations into 2 separate categories: `Angsuran / Hutang Dibayar Bulan Ini` (`debtPaidThisMonth`) and `Sisa Hutang Jatuh Tempo Bulan Ini` (`debtDueThisMonth`).
  - Excluded future-month debts (e.g. November 2026, December 2026, January 2027) from current month Payday net income calculation (`freeToSpend`).

---

## 3. SOP Deployment Pipeline

Before making any commits or releasing:
1. Run Integration Tests: `pnpm --filter @pockt/backend test` (Must pass 17/17).
2. Production Deployment: `wsl docker compose up -d --build` (Use Docker build cache).
3. Push to Remote: `git push origin main`.
