/** Copyright (c) 2026 e2kd7n. All rights reserved. */

# Port Standardization Guide

**Version:** 2.0.0  
**Last Updated:** 2026-05-20

Complete guide for port configuration, deployment modes, and troubleshooting across the Meal Planner application.

---

## 📋 Overview

This document defines the standardized port configuration for the Meal Planner application across all deployment modes (local development, containerized development, and production). It also documents the port consistency audit, implementation, and solutions.

---

## 🎯 Standard Port Assignments

### Core Application Ports

| Service | Port | Protocol | Usage |
|---------|------|----------|-------|
| **Frontend (Dev)** | 5173 | HTTP | Vite development server |
| **Backend API** | 3000 | HTTP | Express.js API server |
| **Nginx Proxy** | 8080 | HTTP | Production reverse proxy |
| **PostgreSQL** | 5432 | TCP | Database server |
| **Redis** | 6379 | TCP | Cache/session store |
| **HTTPS (Optional)** | 443 | HTTPS | Secure connections |

### Deployment Mode URLs

**Local Development:**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- API: `http://localhost:3000/api`

**Container Deployment:**
- Application: `http://localhost:8080`
- API: `http://localhost:8080/api`
- Health: `http://localhost:8080/health`

---

## 🚀 Deployment Modes

### Mode 1: Local Development (Port 5173)

**When to use:** Actively developing features

**Services run directly via npm/pnpm:**
```
Frontend:  http://localhost:5173  (Vite dev server)
Backend:   http://localhost:3000  (Express direct)
Database:  localhost:5432          (PostgreSQL)
Redis:     localhost:6379          (Redis)
```

**Configuration:**
- `frontend/.env`: `VITE_API_URL=http://localhost:3000/api`
- `backend/.env`: `CORS_ORIGIN=http://localhost:5173`

**Pros:**
- Hot reload for instant feedback
- Faster iteration cycle
- Easier debugging with source maps
- Direct access to dev tools

**Cons:**
- Not production-like environment
- Different behavior than containers
- Manual service management

**Start:** `./scripts/local-run.sh`

### Mode 2: Container Deployment (Port 8080)

**When to use:** Testing production-like setup, deploying

**Services run in Podman containers:**
```
Application: http://localhost:8080  (nginx proxy)
API:         http://localhost:8080/api
Health:      http://localhost:8080/health
Database:    Internal (postgres:5432)
Redis:       Internal (redis:6379)
```

**Configuration:**
- `frontend/.env`: `VITE_API_URL=/api` (relative path)
- `backend/.env`: `CORS_ORIGIN=http://localhost:8080`
- `podman-compose.yml`: nginx ports `8080:80`

**Pros:**
- Production-like environment
- Isolated services
- Reproducible builds
- Easy deployment

**Cons:**
- Slower iteration (requires rebuild)
- More complex debugging
- Higher resource usage

**Start:** `./scripts/deploy-podman.sh`

### Internal Container Communication

Services communicate via Docker/Podman network:
```
nginx → backend:3000
backend → postgres:5432
backend → redis:6379
```

---

## 🔍 Checking Current Deployment Mode

### Quick Check

```bash
./scripts/check-deployment-mode.sh
```

**Example Output (Local Dev):**
```
🔍 Checking Deployment Mode...

✅ LOCAL DEVELOPMENT MODE is running

📱 Access your application at:
   👉 http://localhost:5173

🔧 Backend API: http://localhost:3000/api
❤️  Health Check: http://localhost:3000/health

🛑 To stop: ./scripts/local-dev-stop.sh
```

**Example Output (Container):**
```
🔍 Checking Deployment Mode...

✅ CONTAINER MODE is running

📱 Access your application at:
   👉 http://localhost:8080

🔌 API Endpoint: http://localhost:8080/api
❤️  Health Check: http://localhost:8080/health
📍 Location: Local machine (Podman containers)

🛑 To stop: ./scripts/local-container-stop.sh
```

**Example Output (Nothing Running):**
```
🔍 Checking Deployment Mode...

❌ No deployment detected

Start one of these modes:
  • Local Dev:  ./scripts/local-run.sh
  • Containers: ./scripts/deploy-podman.sh
```

---

## ⚙️ Configuration Files

### Frontend Configuration

**File:** `frontend/.env`
```env
# Local development - direct backend connection
VITE_API_URL=http://localhost:3000/api

# Container deployment - via nginx proxy
# VITE_API_URL=/api
```

**File:** `frontend/vite.config.ts`
```typescript
server: {
  port: 5173,
  strictPort: false,
}
```

### Backend Configuration

**File:** `backend/.env`
```env
PORT=3000
HTTPS_PORT=443
HOST=0.0.0.0

# Local development CORS
CORS_ORIGIN=http://localhost:5173

# Container deployment CORS
# CORS_ORIGIN=http://localhost:8080,http://raspberrypi.local:8080
```

**File:** `backend/src/index.ts`
```typescript
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;
```

### Container Configuration

**File:** `podman-compose.yml`
```yaml
backend:
  environment:
    PORT: 3000
    POSTGRES_PORT: 5432
  
nginx:
  ports:
    - "8080:80"  # HTTP
    - "8443:443" # HTTPS (optional)
```

**File:** `nginx/default.conf`
```nginx
upstream backend {
    server backend:3000;
}
```

---

## 🔧 Port Conflict Resolution

### Check for Port Usage

```bash
# Check if port is in use
lsof -i :5173  # Frontend
lsof -i :3000  # Backend
lsof -i :8080  # Nginx
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Kill process using port
lsof -ti:3000 | xargs kill -9
```

### Change Ports (If Needed)

**Frontend:**
```bash
# Edit frontend/vite.config.ts
server: {
  port: 5174,  # Use different port
}
```

**Backend:**
```bash
# Edit backend/.env
PORT=3001  # Use different port
```

**Nginx:**
```bash
# Edit podman-compose.yml
nginx:
  ports:
    - "8081:80"  # Use different external port
```

---

## 🧪 Testing Port Configuration

### Local Development

```bash
# Start services
cd backend && pnpm dev  # Should start on port 3000
cd frontend && pnpm dev # Should start on port 5173

# Test connectivity
curl http://localhost:3000/health
curl http://localhost:5173

# Test CORS
# Open browser at http://localhost:5173
# Check Network tab - API calls should succeed
```

### Container Deployment

```bash
# Start containers
podman-compose up -d

# Test connectivity
curl http://localhost:8080
curl http://localhost:8080/api/health
curl http://localhost:8080/health

# Check logs
podman-compose logs backend
podman-compose logs nginx
```

### Port Conflict Test

```bash
# Check for port conflicts
lsof -i :5173  # Should show Vite (or nothing)
lsof -i :3000  # Should show Node (or nothing)
lsof -i :8080  # Should show nginx (or nothing)
lsof -i :5432  # Should show PostgreSQL
lsof -i :6379  # Should show Redis
```

---

## 🚨 Common Issues and Solutions

### Issue 1: "Nothing loads at localhost:5173"

**Cause:** You're running container mode  
**Fix:** Access at http://localhost:8080 instead  
**Or:** Switch to local dev mode with `./scripts/local-run.sh`

### Issue 2: "Nothing loads at localhost:8080"

**Cause:** You're running local dev mode  
**Fix:** Access at http://localhost:5173 instead  
**Or:** Switch to container mode with `./scripts/deploy-podman.sh`

### Issue 3: "I don't know what's running"

**Fix:** Run `./scripts/check-deployment-mode.sh`

### Issue 4: Port Already in Use

**Solution:** Check what's using the port and stop it, or change the port in configuration.

```bash
# Find what's using the port
lsof -i :8080

# Kill the process
lsof -ti:8080 | xargs kill -9
```

### Issue 5: Frontend Can't Connect to Backend

**Solution:** Verify VITE_API_URL matches backend port:
- Local dev: `http://localhost:3000/api`
- Container: `/api` (relative, via nginx)

### Issue 6: CORS Errors

**Solution:** Ensure CORS_ORIGIN includes the frontend URL:
- Local dev: `http://localhost:5173`
- Container: `http://localhost:8080`

### Issue 7: Database Connection Failed

**Solution:** Verify DATABASE_URL uses correct port:
- Local: `localhost:5432`
- Container: `postgres:5432`

---

## 📊 Port Consistency Audit Results

### Audit Summary

**Date:** 2026-04-22  
**Status:** ✅ COMPLETE

Completed comprehensive port consistency audit across the entire Meal Planner project. Identified and standardized all port references to ensure consistency between local development and containerized deployment modes.

### Issues Found and Fixed

#### Issue #1: Inconsistent CORS Port
**Location:** `backend/.env`  
**Problem:** CORS_ORIGIN included both port 5173 and 5174  
**Fix:** Removed port 5174, standardized on 5173 only  
**Impact:** Prevents CORS errors in local development

#### Issue #2: Documentation Scattered
**Problem:** Port information spread across multiple docs  
**Fix:** Created centralized `docs/PORT_STANDARDIZATION.md`  
**Impact:** Single source of truth for port configuration

### Files Audited and Updated

**✅ Configuration Files (Correct):**
1. `frontend/vite.config.ts` - Port: 5173 ✅
2. `backend/src/index.ts` - PORT: 3000 ✅
3. `podman-compose.yml` - All ports correct ✅
4. `nginx/default.conf` - Upstream backend:3000 ✅

**✅ Environment Files (Updated):**
1. `backend/.env` - Removed inconsistent port 5174 reference ✅
2. `backend/.env.example` - Correct ✅
3. `frontend/.env` - Correct ✅
4. `frontend/.env.example` - Correct ✅

**✅ Documentation Files (Verified):**
- All documentation files reference correct ports ✅

**✅ Test Configuration (Verified):**
- `frontend/playwright.config.ts` - baseURL: http://localhost:5173 ✅

### Validation Checklist

- [x] All configuration files use standard ports
- [x] Environment files (.env, .env.example) consistent
- [x] CORS origins match frontend ports
- [x] Database URLs use correct port (5432)
- [x] Redis URLs use correct port (6379)
- [x] Nginx upstream points to backend:3000
- [x] Container port mappings correct (8080:80)
- [x] Documentation references accurate
- [x] Test configurations use correct ports
- [x] No hardcoded port references in code

---

## 🛠️ Implementation Summary

### Solution Implemented

**Date:** 2026-05-04  
**Status:** ✅ IMPLEMENTED

#### 1. Created Deployment Mode Detection Script ✅

**File:** `scripts/check-deployment-mode.sh`

**Features:**
- Cross-platform port detection (macOS, Linux, Raspberry Pi)
- Detects local dev mode (port 5173)
- Detects container mode (port 8080)
- Shows correct access URL based on what's running
- Provides clear instructions on how to stop services
- Works with lsof, netstat, and ss commands

#### 2. Integrated Detection into All Startup Scripts ✅

Modified scripts to call `check-deployment-mode.sh` at the end:
- ✅ `scripts/local-run.sh` - Local development mode
- ✅ `scripts/deploy-podman.sh` - Container deployment (local)
- ✅ `scripts/pi-run.sh` - Container deployment (Raspberry Pi)
- ✅ `scripts/pi-bounce.sh` - Restart on Raspberry Pi

**Result:** Every startup script now shows the **same consistent information** via the detection script, which serves as the **single source of truth**.

#### 3. Updated Main README ✅

**Changes:**
- Replaced confusing "start development servers" section
- Added clear "Choose Your Deployment Mode" section
- Included instructions for checking current mode
- Added common issues and solutions
- Linked to comprehensive documentation

### Success Criteria

✅ **Consistency:** All startup scripts show the same information via check-deployment-mode.sh  
✅ **Clarity:** Users immediately know which URL to use  
✅ **Discoverability:** Users can check current mode anytime  
✅ **Cross-platform:** Works on macOS, Linux, and Raspberry Pi  
✅ **Documentation:** Comprehensive guides for users  
✅ **Single Source of Truth:** check-deployment-mode.sh is the authoritative source  

---

## 📝 Migration Checklist

When changing ports, update these files:

- [ ] `frontend/.env` - VITE_API_URL
- [ ] `frontend/vite.config.ts` - server.port
- [ ] `backend/.env` - PORT, CORS_ORIGIN
- [ ] `backend/.env.example` - PORT, CORS_ORIGIN
- [ ] `podman-compose.yml` - ports mapping
- [ ] `nginx/default.conf` - upstream backend
- [ ] Documentation files (README.md, SETUP.md, etc.)
- [ ] Test scripts and CI/CD configurations
- [ ] `scripts/check-deployment-mode.sh` - port detection logic

---

## 💡 Best Practices

1. **Use Standard Ports:** Stick to the defined ports unless there's a conflict
2. **Document Changes:** Update this file if ports are changed
3. **Environment Variables:** Use .env files, never hardcode ports
4. **CORS Configuration:** Always update CORS_ORIGIN when changing frontend port
5. **Health Checks:** Verify all services are accessible after port changes
6. **Firewall Rules:** Update firewall rules if changing exposed ports
7. **Check Current Mode:** Use `check-deployment-mode.sh` when unsure
8. **Single Source of Truth:** All port information flows through detection script

---

## 🔮 Future Enhancements (Not Implemented)

The following were planned but not implemented:

1. **Script Renaming** - Rename scripts for even more clarity:
   - `local-run.sh` → `local-dev-start.sh`
   - `deploy-podman.sh` → `local-container-start.sh`
   - etc.

2. **Backend Logging** - Add deployment mode detection to backend startup logs

3. **Environment Variables** - Add CONTAINER_MODE variable to configs

4. **Menu System** - Update interactive menu with clearer options

These can be implemented in a future phase if needed.

---

## 📚 Related Documentation

- [Main README](../README.md) - Quick start with port information
- [Setup Guide](../SETUP.md) - Setup instructions with port troubleshooting
- [Deployment Guide](../DEPLOYMENT.md) - Deployment instructions
- [Raspberry Pi Deployment](RASPBERRY_PI_DEPLOYMENT.md) - Pi-specific deployment

---

## 🔗 References

- [Vite Server Options](https://vitejs.dev/config/server-options.html)
- [Express.js Port Configuration](https://expressjs.com/en/starter/hello-world.html)
- [Nginx Upstream Configuration](https://nginx.org/en/docs/http/ngx_http_upstream_module.html)
- [Docker Port Mapping](https://docs.docker.com/config/containers/container-networking/)

---

**Last Updated:** 2026-05-20  
**Version:** 2.0.0  
**Maintained by:** Development Team

// Made with Bob