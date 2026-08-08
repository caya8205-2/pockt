# CURRENT STATUS & HANDOFF CONTEXT

Last Updated: 2026-08-08 (Release v0.1.1)

---

## 1. Physical Host & Self-Hosting Architecture

* **Host Machine**: Windows 11 PC (Running 24/7).
* **WSL 2 Configuration (`C:\Users\Caya\.wslconfig`)**:
  ```ini
  [wsl2]
  memory=1.5GB
  swap=1GB
  processors=2
  vmIdleTimeout=-1
  ```
* **Background Keep-Alive Daemon**:
  File `C:\Users\Caya\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\keep-wsl.vbs` executes `wsl.exe --exec sleep infinity` silently in the background on Windows startup to ensure the WSL 2 Virtual Machine is never shut down by Windows idle timeouts when terminal windows are closed.

* **Docker Containers (`docker-compose.yml`)**:
  - `pockt-web`: SvelteKit Frontend (Port `3000`, `mem_limit: 256m`).
  - `pockt-backend`: Fastify REST API + SQLite Database (Port `3001`, `mem_limit: 256m`).

* **Public Ingress / Cloudflare Tunnel**:
  - Service: `cloudflared.service` (Linux systemd service inside WSL).
  - Config File: `/etc/cloudflared/config.yml` (Target: `http://127.0.0.1:3000`).
  - Domain: `https://pockt.caya.web.id`
  - Tunnel ID: `b079efbd-9f60-42da-8932-485df7ad037e` (`pockt-tunnel`).
  - Protocol: Forced **TCP HTTP/2 (`--protocol http2`)** to bypass ISP / Office Firewall UDP port 7844 blocking.

---

## 2. Chronology of Error 1033 & Troubleshooting History

1. **WSL 2 Idle Shutdown Issue**:
   Windows 11 WSL 2 automatically shuts down the VM 60s after all terminal windows are closed. Fixed via `vmIdleTimeout=-1` in `.wslconfig` and `keep-wsl.vbs` startup script.
2. **Dual Cloudflared Audit**:
   Windows host runs `cloudflared.exe` (PID 6060) for legacy project `noctune-tunnel` (`ccd7857a`), while WSL Linux runs `cloudflared` for `pockt-tunnel` (`b079efbd`). Both tunnel credentials and targets are isolated.
3. **UDP QUIC vs TCP HTTP/2**:
   Switched `cloudflared` in WSL from UDP QUIC (port 7844) to TCP HTTP/2 (`--protocol http2`) to prevent packet drops on Indonesian ISPs / office firewalls. Binding updated to `http://127.0.0.1:3000`. CNAME synced via `cloudflared tunnel route dns b079efbd pockt.caya.web.id`.
4. **Systemd Timeout Kill Bug & Memory Allocation**:
   - Systemd Timeout: `/etc/systemd/system/cloudflared.service` was updated to `Type=simple` & `TimeoutStartSec=0` (stopping systemd from killing cloudflared every 15s).
   - WSL Memory Allocation: WSL RAM limit updated to `1.5GB` (with 1GB swap) to give Linux kernel + Docker daemon + cloudflared headroom and prevent memory thrashing.
   - Current Tunnel Status: 4/4 active edge connections (`1xsin07, 1xsin09, 1xsin15, 1xsin18`). `Invoke-WebRequest` and external `curl` return `StatusCode: 200 OK`.

---

## 3. SOP Deployment Pipeline

Before making any commits or releasing:
1. Run Integration Tests: `pnpm --filter @pockt/backend test` (Must pass 17/17).
2. Production Deployment: `wsl docker compose up -d --build` (Use Docker build cache).
3. Push to Remote: `git push origin main`.
