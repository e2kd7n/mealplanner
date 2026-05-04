# Port Consistency Solution - Implementation Plan

**Issue:** Port inconsistency causing confusion about which URL to access  
**Root Cause:** Two deployment modes with different ports, unclear script naming and logging  
**Status:** Ready for Implementation

---

## Problem Summary

You're experiencing frustration because:
1. **Port 5173 doesn't work** when running containers (it's only for local dev)
2. **Scripts aren't clearly labeled** - hard to know which mode you're starting
3. **Logs show inconsistent URLs** - sometimes 5173, sometimes 8080, sometimes 3000
4. **No clear indication** of which deployment mode is active

---

## Solution Overview

### 1. Clear Script Naming Convention

**Current State:**
- `local-run.sh` - Ambiguous (could mean local machine or local dev mode)
- `deploy-podman.sh` - Unclear if for local or remote deployment

**New Structure:**

```
LOCAL DEVELOPMENT MODE (Direct Services - Port 5173)
├── local-dev-start.sh          # Start local dev mode
├── local-dev-stop.sh           # Stop local dev mode
└── local-dev-bounce.sh         # Restart local dev mode

CONTAINER MODE - LOCAL (Podman - Port 8080)
├── local-container-start.sh    # Start containers on local machine
├── local-container-stop.sh     # Stop containers on local machine
└── local-container-bounce.sh   # Restart containers on local machine

CONTAINER MODE - RASPBERRY PI (Podman - Port 8080)
├── pi-container-start.sh       # Start containers on Pi
├── pi-container-stop.sh        # Stop containers on Pi
└── pi-container-bounce.sh      # Restart containers on Pi

UTILITIES
├── menu.sh                     # Interactive menu (updated)
└── check-deployment-mode.sh    # NEW: Check what's currently running
```

### 2. Script Renaming Plan

| Old Name | New Name | Purpose |
|----------|----------|---------|
| `local-run.sh` | `local-dev-start.sh` | Start local development mode (port 5173) |
| `local-stop.sh` | `local-dev-stop.sh` | Stop local development mode |
| `local-bounce.sh` | `local-dev-bounce.sh` | Restart local development mode |
| `deploy-podman.sh` | `local-container-start.sh` | Start containers locally (port 8080) |
| *(new)* | `local-container-stop.sh` | Stop local containers |
| *(new)* | `local-container-bounce.sh` | Restart local containers |
| `pi-run.sh` | `pi-container-start.sh` | Start containers on Pi |
| `pi-stop.sh` | `pi-container-stop.sh` | Stop containers on Pi |
| `pi-bounce.sh` | `pi-container-bounce.sh` | Restart containers on Pi |

### 3. Enhanced Startup Banners

Every script will display a clear banner showing:
- **Deployment mode** (Local Dev vs Container)
- **Exact access URL** (5173 vs 8080)
- **What services are starting**
- **How to stop the services**

**Example: `local-dev-start.sh`**
```bash
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          🚀 LOCAL DEVELOPMENT MODE                         ║
║                                                            ║
║  Services run directly (not in containers)                 ║
║  Frontend: Vite dev server with hot reload                 ║
║  Backend: Nodemon with auto-restart                        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

📱 ACCESS YOUR APPLICATION AT:
   
   👉 http://localhost:5173 👈
   
   Backend API: http://localhost:3000/api
   Health Check: http://localhost:3000/health

⚠️  IMPORTANT: Use port 5173, NOT 8080
    (Port 8080 is only for container mode)

🛑 TO STOP: Press Ctrl+C or run ./scripts/local-dev-stop.sh
```

**Example: `local-container-start.sh`**
```bash
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          🐳 CONTAINER MODE (LOCAL)                         ║
║                                                            ║
║  Services run in Podman containers                         ║
║  Production-like environment on your local machine         ║
║  All traffic routed through nginx proxy                    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

📱 ACCESS YOUR APPLICATION AT:
   
   👉 http://localhost:8080 👈
   
   API Endpoint: http://localhost:8080/api
   Health Check: http://localhost:8080/health

⚠️  IMPORTANT: Use port 8080, NOT 5173
    (Port 5173 is only for local dev mode)

🛑 TO STOP: Run ./scripts/local-container-stop.sh
```

### 4. New Utility Script: `check-deployment-mode.sh`

This script will detect what's currently running:

```bash
#!/bin/bash

echo "🔍 Checking Deployment Mode..."
echo ""

# Check for local dev mode
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ LOCAL DEVELOPMENT MODE is running"
    echo "   Access at: http://localhost:5173"
    echo "   Stop with: ./scripts/local-dev-stop.sh"
    exit 0
fi

# Check for container mode
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ CONTAINER MODE is running"
    echo "   Access at: http://localhost:8080"
    
    # Check if it's local or remote
    if podman ps --format "{{.Names}}" | grep -q "meals-"; then
        echo "   Location: Local machine"
        echo "   Stop with: ./scripts/local-container-stop.sh"
    else
        echo "   Location: Remote (possibly Pi)"
        echo "   Stop with: ./scripts/pi-container-stop.sh"
    fi
    exit 0
fi

# Nothing running
echo "❌ No deployment detected"
echo ""
echo "Start one of these modes:"
echo "  • Local Dev:  ./scripts/local-dev-start.sh"
echo "  • Containers: ./scripts/local-container-start.sh"
```

### 5. Backend Logging Enhancement

Update `backend/src/index.ts` to show deployment mode:

```typescript
// Detect deployment mode
const isContainerMode = process.env.CONTAINER_MODE === 'true';
const deploymentMode = isContainerMode ? 'CONTAINER' : 'LOCAL DEVELOPMENT';

// Enhanced startup logging
logger.info('═'.repeat(70));
logger.info('🚀 Meal Planner Backend Started');
logger.info('═'.repeat(70));
logger.info(`📍 Deployment Mode: ${deploymentMode}`);
logger.info(`🔧 Backend Internal: http://${HOST}:${PORT}`);
logger.info(`❤️  Health Check: http://${HOST}:${PORT}/health`);
logger.info('');

if (isContainerMode) {
  logger.info('🐳 CONTAINER MODE DETECTED');
  logger.info('');
  logger.info('📱 Access your application at:');
  logger.info('   👉 http://localhost:8080');
  logger.info('');
  logger.info('🔌 API Endpoint: http://localhost:8080/api');
  logger.info('⚠️  Do NOT use port 5173 in container mode');
} else {
  logger.info('💻 LOCAL DEVELOPMENT MODE');
  logger.info('');
  logger.info('📱 Access your application at:');
  logger.info('   👉 http://localhost:5173');
  logger.info('');
  logger.info('🔌 API Endpoint: http://localhost:3000/api');
  logger.info('⚠️  Do NOT use port 8080 in local dev mode');
}

logger.info('═'.repeat(70));
```

### 6. Updated Menu System

Update `scripts/menu.sh` with clear options:

```bash
echo "╔════════════════════════════════════════════════════════════╗"
echo "║        Meal Planner - Deployment Menu                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Choose your deployment mode:"
echo ""
echo "LOCAL DEVELOPMENT (Port 5173)"
echo "  1) Start Local Dev Mode"
echo "  2) Stop Local Dev Mode"
echo "  3) Restart Local Dev Mode"
echo ""
echo "CONTAINER MODE - LOCAL (Port 8080)"
echo "  4) Start Containers Locally"
echo "  5) Stop Containers Locally"
echo "  6) Restart Containers Locally"
echo ""
echo "CONTAINER MODE - RASPBERRY PI (Port 8080)"
echo "  7) Deploy to Raspberry Pi"
echo "  8) Stop Pi Containers"
echo "  9) Restart Pi Containers"
echo ""
echo "UTILITIES"
echo "  10) Check Current Deployment Mode"
echo "  11) View Logs"
echo "  12) Database Operations"
echo ""
echo "  0) Exit"
```

### 7. Quick Reference Documentation

Create `docs/QUICK_START.md`:

```markdown
# Quick Start Guide

## Which Mode Should I Use?

### 🚀 Local Development Mode (Port 5173)
**Use when:** Actively developing features
**Pros:** Hot reload, faster iteration, easier debugging
**Cons:** Not production-like
**Start:** `./scripts/local-dev-start.sh`
**Access:** http://localhost:5173

### 🐳 Container Mode (Port 8080)
**Use when:** Testing production-like setup, deploying
**Pros:** Production-like, isolated, reproducible
**Cons:** Slower iteration, requires rebuild for changes
**Start:** `./scripts/local-container-start.sh`
**Access:** http://localhost:8080

## Common Issues

### "Nothing loads at localhost:5173"
**Cause:** You're running container mode
**Fix:** Access at http://localhost:8080 instead
**Or:** Switch to local dev mode with `./scripts/local-dev-start.sh`

### "Nothing loads at localhost:8080"
**Cause:** You're running local dev mode
**Fix:** Access at http://localhost:5173 instead
**Or:** Switch to container mode with `./scripts/local-container-start.sh`

### "I don't know what's running"
**Fix:** Run `./scripts/check-deployment-mode.sh`
```

---

## Implementation Checklist

### Phase 1: Script Reorganization ✅
- [ ] Rename `local-run.sh` → `local-dev-start.sh`
- [ ] Rename `local-stop.sh` → `local-dev-stop.sh`
- [ ] Rename `local-bounce.sh` → `local-dev-bounce.sh`
- [ ] Rename `deploy-podman.sh` → `local-container-start.sh`
- [ ] Create `local-container-stop.sh`
- [ ] Create `local-container-bounce.sh`
- [ ] Rename `pi-run.sh` → `pi-container-start.sh`
- [ ] Rename `pi-stop.sh` → `pi-container-stop.sh`
- [ ] Rename `pi-bounce.sh` → `pi-container-bounce.sh`
- [ ] Create `check-deployment-mode.sh`
- [ ] Create symlinks for backward compatibility

### Phase 2: Enhanced Logging ✅
- [ ] Add deployment mode banners to all start scripts
- [ ] Add clear access URLs to all start scripts
- [ ] Add "how to stop" instructions to all start scripts
- [ ] Update backend logging in `backend/src/index.ts`
- [ ] Add CONTAINER_MODE environment variable support

### Phase 3: Documentation ✅
- [ ] Create `docs/QUICK_START.md`
- [ ] Update `README.md` with clear mode selection
- [ ] Update `docs/PORT_STANDARDIZATION.md`
- [ ] Create troubleshooting section in docs

### Phase 4: Configuration ✅
- [ ] Add CONTAINER_MODE to `podman-compose.yml`
- [ ] Add CONTAINER_MODE to `podman-compose.pi.yml`
- [ ] Update `.env.example` with mode documentation

### Phase 5: Testing ✅
- [ ] Test local dev mode startup and URLs
- [ ] Test container mode startup and URLs
- [ ] Test mode detection script
- [ ] Test all renamed scripts
- [ ] Verify backward compatibility with symlinks

---

## Backward Compatibility

To avoid breaking existing workflows, create symlinks:

```bash
# In scripts/ directory
ln -s local-dev-start.sh local-run.sh
ln -s local-dev-stop.sh local-stop.sh
ln -s local-dev-bounce.sh local-bounce.sh
ln -s local-container-start.sh deploy-podman.sh
```

---

## Success Criteria

✅ Script names clearly indicate deployment mode  
✅ Every startup shows the correct access URL  
✅ Users can check current mode with one command  
✅ No confusion about which port to use  
✅ Clear error messages for port conflicts  
✅ Documentation matches actual behavior  

---

## Next Steps

Ready to implement? Switch to Code mode to:
1. Rename and update all scripts
2. Add enhanced logging to backend
3. Create new utility scripts
4. Update documentation
5. Test thoroughly

Would you like me to proceed with implementation?