# CURRENT STATUS & HANDOFF CONTEXT

Last Updated: 2026-08-08 (Release v0.1.1 + Cloudflare Tunnel 1033 Root Cause Fixed)

---

## 1. Physical Host & Self-Hosting Architecture

* **Host Machine**: Windows 11 PC (Running 24/7).
* **WSL 2 Configuration (`C:\Users\Caya\.wslconfig`)**:
  ```ini
  [wsl2]
  memory=2GB
  swap=1GB
  processors=2
  vmIdleTimeout=-1
  ```
  Note: `vmIdleTimeout=-1` alone is NOT reliable in this WSL build (2.7.11) — the VM still idle-terminates when the last `wsl.exe` client disconnects. A persistent keep-alive session is required (see below).

* **Keep-Alive (mandatory, anti idle-terminate)**:
  File `C:\Users\Caya\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\pockt-wsl-keepalive.vbs` runs `wsl.exe -e sleep infinity` silently (hidden window) at every Windows logon. This keeps at least one WSL session permanently open, so the VM is never shut down by WSL idle logic when terminals are closed. Without it, closing the last Ubuntu terminal kills the whole stack (docker + cloudflared) after ~60s.

* **Docker Containers (`docker-compose.yml`)**:
  - `pockt-web`: SvelteKit Frontend (Port `3000`, `mem_limit: 256m`).
  - `pockt-backend`: Fastify REST API + SQLite Database (Port `3001`, `mem_limit: 256m`).
  Both `restart: unless-stopped`; `docker` systemd service is `enabled` in WSL.

* **Public Ingress / Cloudflare Tunnel — managed by PM2 (since 2026-08-08)**:
  - Process manager: **PM2 7.0.3** inside WSL (`/usr/local/bin/pm2`, node 22.22.1 from apt).
  - App: `cloudflared` (pm2 id 0), command: `/usr/bin/cloudflared --no-autoupdate --protocol quic --config /etc/cloudflared/config.yml tunnel run`.
  - Config: `/etc/cloudflared/config.yml` (Target: `http://127.0.0.1:3000`), creds at `/home/caya/.cloudflared/`.
  - Domain: `https://pockt.caya.web.id` — Tunnel ID: `b079efbd-9f60-42da-8932-485df7ad037e` (`pockt-tunnel`).
  - Protocol: **QUIC (UDP)** — switched back from HTTP/2 during the 1033 investigation (edge connectivity was fine either way).
  - Autostart chain: PM2 daemon → `pm2-caya.service` (systemd, enabled) → resurrects cloudflared from `/home/caya/.pm2/dump.pm2` (`pm2 save` already persisted).
  - Old systemd unit `/etc/systemd/system/cloudflared.service` is **disabled** (kept as backup; do not re-enable while PM2 runs).
  - Useful commands: `pm2 status`, `pm2 logs cloudflared`, `pm2 monit`, `pm2 save`, `pm2 startup` (already configured).

* **Windows host still runs its own `cloudflared.exe` for the legacy `noctune-tunnel` (`ccd7857a` → `noctune.my.id` → port 3131)** — completely separate, do not touch.

---

## 2. Root Cause of the 1033 / Service-Restart Cycle (RESOLVED)

### Symptoms
Site intermittently returned 1033/530; `cloudflared` and docker containers stopped/started in bursts every ~10-12 minutes; `journalctl` showed "all connections terminated" plus a flood of `Started xxx.service` lines, and WSL init logged `systemctl poweroff did not terminate ... calling reboot(RB_POWER_OFF)`.

### Investigation eliminated these suspects
* No OOM (dmesg clean, 2GB RAM healthy).
* No cron/timer/scripts inside WSL.
* No Windows Scheduled Tasks touching wsl/cloudflared; Windows System event log clean (no sleep/hibernate events).
* Discord bot `C:\Users\Caya\Desktop\Project\bot-ditos` (runs on Windows node, not WSL) contains no wsl/systemctl/cloudflared code — not the trigger.
* Kernel itself never crashed: `/proc/uptime` stayed continuous across the events.

### Actual root cause
**WSL 2 idle termination.** Every time the last `wsl.exe` client session closed (closing the Ubuntu terminal — including short-lived session opens/closes during troubleshooting), WSL 2 tried to shut the VM down. The graceful poweroff failed (`systemctl poweroff did not terminate in 10000 ms`), the forced path killed systemd services mid-run (docker, cloudflared → 1033), and journal files ended up corrupted ("corrupted or uncleanly shut down, renaming and replacing"). `vmIdleTimeout=-1` in `.wslconfig` did **not** prevent it in this WSL build.

### Proof
A persistent `wsl -e sleep` keep-alive session stopped the cycle instantly: containers stayed up continuously (previously restarting every ~10-12 min).

### Fixes applied (approach)
1. **Permanent keep-alive**: `pockt-wsl-keepalive.vbs` in Windows Startup folder (runs at logon, hidden, `wsl -e sleep infinity`). VM can no longer idle-terminate while the user is logged in.
2. **PM2 takeover of cloudflared** (instead of systemd): gives visible logs/status (`pm2 status`, `pm2 logs cloudflared`), aggressive auto-restart, and `pm2 startup systemd` + `pm2 save` so the tunnel survives VM boots.
3. Installed node 22 + npm in WSL (apt) to host PM2.
4. Killed leftover zombie dev servers on Windows (`pnpm --filter @pockt/backend dev` PID 18328 and its `tsx watch` child PID 18880) — dev backend is only started on demand.

### Notes
* The whole autostart chain activates at **Windows logon** (Startup folder requires a user session); on boot-to-lock-screen the site comes up only after login. Acceptable for a personal PC.
* The systemd `cloudflared.service` file remains as a fallback if PM2 is ever removed.

---

## 3. Security Hardening (shipped in v0.1.1)

* **Sessions table**: random 256-bit session tokens, 30-day expiry, session cookie `HttpOnly` + `SameSite=Lax` + `Secure` (prod).
* **Rate limiting**: 10 attempts / 15 min / IP (honors `CF-Connecting-IP` behind the tunnel) on login, register, setup.
* **Single-owner enforcement**: register/setup return 403 once the owner account exists (prod has 2 pre-existing users — kept intact).
* **CORS**: `origin: false` (API is same-origin via tunnel).
* **Fail-closed `COOKIE_SECRET`**: placeholder secret is rejected at boot in production.
* **Backup script**: `pnpm --filter @pockt/backend backup` → `node dist/scripts/backup.js` (WAL-safe SQLite online backup, keeps 14). In prod: `docker exec -w /app/apps/backend pockt-backend pnpm backup` → `data/backups/`.
* **Prod DB gotcha (WAL mode)**: `/app/apps/backend/data/pockt.prod.db` (volume `pockt-db-data`) — the main file is only ~4KB; real data lives in `-wal`. NEVER copy the bare main file (looks empty); use the backup script. Latest snapshot copied locally: `apps/backend/data/pockt-2026-08-08T03-52-58-654Z.db`.
* Verified live: sessions table auto-migrated, rate limit 429 in container, data intact.

---

## 4. SOP Deployment Pipeline

Before making any commits or releasing:
1. Run Integration Tests: `pnpm --filter @pockt/backend test` (Must pass 17/17).
2. Production Deployment: `wsl docker compose up -d --build` (Use Docker build cache).
3. Push to Remote: `git push origin main`.

Post-boot smoke test (WSL):
```sh
pm2 status                      # cloudflared online, 0 restarts
pm2 logs cloudflared --lines 20 --nostream   # "Registered tunnel connection"
systemctl is-enabled pm2-caya   # enabled
docker ps                       # pockt-web + pockt-backend Up
```

---

## 5. Summary of the 2026-08-08 Session (v0.1.1 + tunnel fix)

* **Released v0.1.1**: full security hardening (section 3) deployed to WSL prod, tests 17/17 (backend) + 33/33 (e2e), svelte-check clean, data intact, backups working. Commits `7d4379a` (hardening), `aabed0e` (docs), `fa16dd9` (full handover).
* **Tunnel saga resolved**: root cause = WSL idle-termination (section 2); fix = Startup keep-alive VBS + PM2-managed cloudflared with `pm2 startup` + docker enabled at boot.
* **Environment additions in WSL**: node 22.22.1, npm 9.2.0, pm2 7.0.3; `.wslconfig` finalized at memory=2GB / swap=1GB / processors=2 / vmIdleTimeout=-1.
* **Cleanups**: zombie pockt dev servers killed (PIDs 18328/18880; earlier 7324); empty 4KB `pockt.prod.db` copy in project root may be deleted (`*.db` is gitignored).
* **Untouched**: Windows PM2 7.0.1 (noctune project), bot-ditos (running, PID 19364/24700), noctune cloudflared tunnel.
* **Current status**: `https://pockt.caya.web.id` HTTP 200, cloudflared online under PM2 (QUIC, precheck pass), containers stable since the keep-alive was installed.

---

## 6. Known Gotchas

* Do **not** re-enable `cloudflared.service` (systemd) while PM2 manages the tunnel — two instances conflict on the same tunnel.
* The keep-alive only guarantees the VM while the Windows user session is logged in (Startup folder). Logging off / reboot-without-login leaves the site down until next logon.
* WSL `sudo` password is not stored in this repo — ask the user if elevated commands are needed.
* WSL commands from PowerShell can intermittently fail with `Wsl/Service/0x8007274c` (VM busy during boot/termination); simply retry.
