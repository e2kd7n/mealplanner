# Quick Start Guide

**Last Updated:** 2026-05-04

## 🚀 Choose Your Deployment Mode

The Meal Planner application supports two deployment modes. **Choose the one that fits your needs:**

---

## Mode 1: Local Development (Port 5173)

### When to Use
- ✅ Actively developing features
- ✅ Need hot reload for fast iteration
- ✅ Want easier debugging with source maps
- ✅ Working on frontend or backend code

### Pros & Cons
**Pros:**
- Hot reload - changes appear instantly
- Faster iteration cycle
- Easier debugging
- Direct access to logs

**Cons:**
- Not production-like
- Requires Node.js and dependencies installed
- Services run directly on your machine

### How to Start
```bash
./scripts/local-run.sh
```

### Access URL
```
👉 http://localhost:5173
```

### How to Stop
Press `Ctrl+C` or run:
```bash
./scripts/local-stop.sh
```

### How to Restart
```bash
./scripts/local-bounce.sh
```

---

## Mode 2: Container Mode (Port 8080)

### When to Use
- ✅ Testing production-like setup
- ✅ Preparing for deployment
- ✅ Want isolated, reproducible environment
- ✅ Testing with nginx reverse proxy

### Pros & Cons
**Pros:**
- Production-like environment
- Isolated from host system
- Reproducible across machines
- Tests full stack including nginx

**Cons:**
- Slower iteration (requires rebuild)
- More resource intensive
- Requires Docker/Podman

### How to Start (Local Machine)
```bash
./scripts/deploy-podman.sh
# or
podman-compose up -d
```

### How to Start (Raspberry Pi)
```bash
./scripts/pi-run.sh
```

### Access URL
```
👉 http://localhost:8080
```

### How to Stop
**Local:**
```bash
podman-compose down
```

**Raspberry Pi:**
```bash
./scripts/pi-stop.sh
```

### How to Restart
**Local:**
```bash
podman-compose restart
```

**Raspberry Pi:**
```bash
./scripts/pi-bounce.sh
```

---

## 🔍 Check Current Mode

Not sure what's running? Use this command:

```bash
./scripts/check-deployment-mode.sh
```

This will tell you:
- ✅ Which mode is currently active
- 📱 The correct URL to access the application
- 🛑 How to stop the services

---

## ❌ Common Issues

### "Nothing loads at localhost:5173"

**Cause:** You're running container mode, not local dev mode.

**Solution:**
1. Access at `http://localhost:8080` instead, OR
2. Switch to local dev mode:
   ```bash
   podman-compose down  # Stop containers
   ./scripts/local-run.sh  # Start local dev
   ```

### "Nothing loads at localhost:8080"

**Cause:** You're running local dev mode, not container mode.

**Solution:**
1. Access at `http://localhost:5173` instead, OR
2. Switch to container mode:
   ```bash
   ./scripts/local-stop.sh  # Stop local dev
   ./scripts/deploy-podman.sh  # Start containers
   ```

### "I don't know what's running"

**Solution:**
```bash
./scripts/check-deployment-mode.sh
```

This will show you exactly what's running and how to access it.

### "Port already in use"

**Cause:** Another service is using the port, or a previous instance didn't stop cleanly.

**Solution:**

For port 5173 (local dev):
```bash
# Find and kill the process
lsof -ti:5173 | xargs kill -9
```

For port 8080 (containers):
```bash
# Stop all containers
podman-compose down
# or
docker-compose down
```

---

## 📊 Port Reference

| Mode | Frontend | Backend | Access URL |
|------|----------|---------|------------|
| **Local Dev** | 5173 | 3000 | http://localhost:5173 |
| **Container** | N/A (static) | N/A (internal) | http://localhost:8080 |

**Important:** These are **different modes** - don't mix them up!

---

## 🎯 Quick Decision Guide

**Choose Local Development if:**
- You're writing code
- You need fast feedback
- You're debugging issues

**Choose Container Mode if:**
- You're testing the full stack
- You're preparing for deployment
- You want a production-like environment

---

## 📝 Test Credentials

Both modes use the same test account:

```
Email: test@example.com
Password: TestPass123!
```

Or use the "Quick Test Login (Smith Family)" button on the login page.

---

## 🆘 Need Help?

1. **Check deployment mode:** `./scripts/check-deployment-mode.sh`
2. **View logs:**
   - Local dev: `tail -f backend.log` or `tail -f frontend.log`
   - Containers: `podman-compose logs -f`
3. **Run diagnostics:** `./scripts/pi-diagnostics.sh` (on Pi)
4. **Check documentation:** See `docs/` directory for detailed guides

---

## 🔗 Related Documentation

- [Local Development Guide](LOCAL_DEVELOPMENT.md)
- [Port Standardization](PORT_STANDARDIZATION.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [Raspberry Pi Deployment](RASPBERRY_PI_DEPLOYMENT_GUIDE.md)