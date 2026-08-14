# Pockt Self-Hosting & Background Process Architecture

Dokumentasi lengkap mengenai arsitektur self-hosting, background process, dan integrasi Hermes AI agent yang berjalan di PC (WSL 2).

---

## 1. Lingkungan & Server Overview

- **Host Machine:** Windows PC (WSL 2 Ubuntu, user: `caya`).
- **Domain Publik Pockt:** `https://pockt.caya.web.id`
- **WSL Status:** Selalu aktif setiap startup PC melalui keep-alive system (`wsl.exe -e sleep infinity`).
- **WSL Systemd:** Aktif (`systemd=true`), mengelola service `pm2-caya.service` otomatis saat boot.

---

## 2. Service Management di WSL

Semua service background dikelola secara otomatis di dalam WSL:

### A. PM2 Process Manager (`pm2 list`)
Service yang dipantau dan otomatis di-restart oleh PM2:
1. **`9router`**: Local LLM/API proxy router di port `20128` (0.0.0.0).
2. **`hermes-dashboard`**: Web dashboard Hermes Agent (port `9119`, running with `--no-open --skip-build`).
3. **`cloudflared`**: Cloudflare Tunnel untuk routing publik domain ke local port.
4. **`bot-ditos`**: Proyek bot Telegram pendukung.

> **Perintah PM2 Berguna:**
> - `pm2 list` / `pm2 ls`: Cek status semua background process
> - `pm2 logs [nama-app]`: Lihat log real-time
> - `pm2 restart [nama-app]`: Restart process tertentu
> - `pm2 save`: Menyimpan snapshot service aktif ke `/home/caya/.pm2/dump.pm2`

### B. Hermes Agent Gateway
Hermes Agent terpasang di host dengan wrapper executable di WSL `~/.local/bin/hermes`.
1. **Default Gateway Profile:**
   - Dijalankan via `hermes gateway start`
2. **Pockt Agent Profile (`pockt-agent`):**
   - Config directory: `C:\Users\Caya\AppData\Local\hermes\profiles\pockt-agent`
   - Dijalankan via `hermes -p pockt-agent gateway start`
   - Terhubung ke Pockt MCP Server (`@pockt/mcp-server`) di `https://pockt.caya.web.id`
   - AI Model Provider: `openai-api` via proxy `9router` (`http://127.0.0.1:20128/v1` model `oc/deepseek-v4-flash-free`).

---

## 3. Pockt Docker Deployment

Aplikasi Pockt berjalan di dalam Docker container di WSL:
- **`pockt-backend`**: Node.js/Express API (port internal 3002 / 3001)
- **`pockt-web`**: SvelteKit Frontend (port internal 3000)

### Alias Deployment di WSL:
- `pockt-deploy`: Rebuild & restart container (`cd /mnt/c/Users/Caya/Desktop/Project/pockt && docker compose up -d --build`)
- `pockt-status`: Cek status container (`docker compose ps`)
- `pockt-logs`: Pantau log container (`docker compose logs -f --tail=50`)
- `pockt [deploy|logs|stop|status]`: Helper CLI terpadu

---

## 4. Alur Integrasi Bot Telegram → MCP → Pockt API

```
[User Chat di Telegram]
       ↓
[Hermes Gateway (pockt-agent)]
       ↓
[LLM via 9router (Local Proxy:20128)]
       ↓
[Hermes MCP Server (@pockt/mcp-server)]
       ↓
[Pockt REST API (https://pockt.caya.web.id)]
       ↓
[SQLite Database (pockt.db)]
```
