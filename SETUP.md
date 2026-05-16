# Development Environment Setup Guide

This guide covers setting up a local development environment for the Family Meal Planner application on macOS, Linux, or Windows (WSL2).

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20 LTS | |
| pnpm | 8+ | `npm install -g pnpm` |
| Podman + podman-compose | Latest | Runs the local Postgres container |
| Git | Any recent | |

---

## 1. Install Node.js 20

**macOS (Homebrew):**
```bash
brew install node@20
```

**Linux (apt):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows (WSL2):** Use the Linux instructions above inside WSL2, or install via [nvm-windows](https://github.com/coreybutler/nvm-windows).

Verify:
```bash
node --version   # v20.x.x
npm --version    # 10.x.x
```

---

## 2. Install pnpm

```bash
npm install -g pnpm
pnpm --version   # 8.x.x
```

---

## 3. Install Podman and podman-compose

Podman runs the local PostgreSQL container during development. Only Postgres runs in a container; the frontend and backend run as host processes.

**macOS:**
```bash
brew install podman podman-compose
podman machine init
podman machine start
```

**Linux:**
```bash
sudo apt-get install -y podman
pip3 install podman-compose
# Add ~/.local/bin to PATH if needed
echo 'export PATH=$PATH:$HOME/.local/bin' >> ~/.bashrc && source ~/.bashrc
```

**Windows (WSL2):**
```bash
# Inside WSL2
sudo apt-get install -y podman
pip3 install podman-compose
```

Verify:
```bash
podman --version
podman-compose --version
```

---

## 4. Install Dependencies

```bash
# Frontend
cd frontend && pnpm install

# Backend
cd ../backend && pnpm install
```

---

## 5. Configure Environment

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT secrets, etc.
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
# Typically no changes needed for local dev
```

---

## 6. Start the App

```bash
# From project root — starts Postgres in Podman, then frontend + backend as host processes
./scripts/local-run.sh
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

See the main [README.md](./README.md) for full deployment mode options and the interactive `./scripts/menu.sh`.

---

## 7. Database Setup (first run only)

```bash
cd backend
pnpm run prisma:migrate   # Apply migrations
pnpm run prisma:seed      # Optional: seed sample data
```

---

## Troubleshooting

### Port already in use

**macOS / Linux:**
```bash
lsof -i :3000   # Find what's using port 3000
kill -9 <PID>
```

**Windows (PowerShell):**
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Podman machine not running (macOS only)

```bash
podman machine start
```

### Podman socket errors (macOS only)

```bash
podman machine stop
podman machine start
```

### pnpm permission errors

Never use `sudo` with pnpm. If you hit permission errors, configure a user-local global prefix:

```bash
mkdir -p ~/.pnpm-global
pnpm config set global-bin-dir ~/.pnpm-global/bin
# Add ~/.pnpm-global/bin to your PATH
```

---

## Recommended VS Code Extensions

- ESLint
- Prettier
- Prisma
- TypeScript and JavaScript Language Features (built-in)
- GitLens

---

## Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [pnpm Documentation](https://pnpm.io/)
- [Podman Documentation](https://docs.podman.io/)
- [Vite Documentation](https://vitejs.dev/)
- [Prisma Documentation](https://www.prisma.io/docs/)
