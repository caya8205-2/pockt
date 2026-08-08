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
  - `pockt-backend`: Fastify REST API + SQLite Database (Port `3001`, `mem_limit: 256m`).

* **Public Ingress / Cloudflare Tunnel**:
  - Service: `cloudflared.service` (Linux systemd service inside WSL).
  - Target: `http://127.0.0.1:3000`
  - Domain: `https://pockt.caya.web.id`
  - Tunnel ID: `b079efbd-9f60-42da-8932-485df7ad037e` (`pockt-tunnel`).
  - Protocol: **TCP HTTP/2 (`--protocol http2`)**.

---

## 2. Release v0.2.1 Highlights

- **Dynamic Payday Cycle Window**: Payday Planning (`/payday`) calculates financial totals based on user's monthly salary date (default: 5th of every month, e.g. 5 Aug – 4 Sep).
- **Eliminated Fake Free-to-Spend Illusion**: Debts/Paylater due on the 1st of next month are automatically included in the current salary cycle because they fall before the next salary arrives on the 5th.
- **Configurable Payday Date Setting**: Added `paydayDate` (1–31) user setting in SQLite DB (`users` table) with API `PUT /api/user/settings` and interactive UI modal on `/payday`.
- **Payday Cycle Badge**: Displays active cycle date range in the header of `/payday` overview page.

---

## 3. SOP Deployment Pipeline

Before making any commits or releasing:
1. Run Integration Tests: `pnpm --filter @pockt/backend test` (Must pass 17/17).
2. Production Deployment: `wsl docker compose up -d --build` (Use Docker build cache).
3. Push to Remote: `git push origin main`.
4. Create Release & Tag: `gh release create v0.2.x`.
