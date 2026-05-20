/** Copyright (c) 2026 e2kd7n. All rights reserved. */

# Raspberry Pi Troubleshooting Guide

Comprehensive troubleshooting guide for Raspberry Pi deployment issues, including common problems, diagnostic steps, and solutions.

---

## 🚨 Common Issues

### Issue 1: Backend Container Exiting with Status 159

The backend container exits immediately after startup with exit code 159, indicating a startup failure.

#### Diagnostic Steps

Run these commands on your Raspberry Pi to diagnose the issue:

**1. Check Container Logs (Full Output)**
```bash
cd ~/mealplanner
podman logs meals-backend 2>&1 | tail -100
```

**2. Verify Secrets Exist**
```bash
ls -la ~/mealplanner/secrets/
cat ~/mealplanner/secrets/postgres_password.txt
cat ~/mealplanner/secrets/jwt_secret.txt
cat ~/mealplanner/secrets/jwt_refresh_secret.txt
cat ~/mealplanner/secrets/session_secret.txt
```

**3. Check Database Connectivity**
```bash
podman exec meals-postgres pg_isready -U mealplanner -d meal_planner
```

**4. Verify Image Integrity**
```bash
podman images | grep meals-backend
podman inspect meals-backend:latest | grep -A 5 "Entrypoint\|Cmd"
```

**5. Test Container Manually**
```bash
# Try running the container interactively to see startup errors
podman run --rm -it \
  --network meals-network \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e POSTGRES_HOST=postgres \
  -e POSTGRES_PORT=5432 \
  -e POSTGRES_DB=meal_planner \
  -e POSTGRES_USER=mealplanner \
  -v ~/mealplanner/secrets/postgres_password.txt:/run/secrets/postgres_password:ro \
  -v ~/mealplanner/secrets/jwt_secret.txt:/run/secrets/jwt_secret:ro \
  -v ~/mealplanner/secrets/jwt_refresh_secret.txt:/run/secrets/jwt_refresh_secret:ro \
  -v ~/mealplanner/secrets/session_secret.txt:/run/secrets/session_secret:ro \
  meals-backend:latest
```

#### Solutions

**Missing or Invalid Secrets**
```bash
cd ~/mealplanner
./scripts/generate-secrets.sh
```

**Database Not Ready**
```bash
# Wait for postgres to be fully ready
podman-compose -f podman-compose.pi.yml up -d postgres
sleep 30
podman-compose -f podman-compose.pi.yml up -d backend
```

**Memory Issues (OOM Killer)**
```bash
# Check system memory
free -h

# Check for OOM events
sudo dmesg | grep -i "out of memory"

# Increase swap if needed
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

**Corrupted Image**
```bash
# Remove and reload the image
podman rmi meals-backend:latest
cd ~/mealplanner
./scripts/load-pi-images.sh
```

**Entrypoint Script Issues**
```bash
# Check if entrypoint script has correct line endings (LF not CRLF)
podman run --rm meals-backend:latest cat /app/docker-entrypoint.sh | file -

# If it shows CRLF, rebuild the image with correct line endings
```

**Node.js Memory Limit Too Low**

Edit `podman-compose.pi.yml` and increase NODE_OPTIONS:
```yaml
environment:
  NODE_OPTIONS: --max-old-space-size=512  # Increase from 256
```

---

### Issue 2: Platform Mismatch Warnings

**Symptoms:** Warnings like `image platform ({arm64 linux [] v8}) does not match the expected platform ({arm linux [] })`

**Cause:** Images were built for wrong architecture (64-bit vs 32-bit)

**Solutions:**
```bash
# 1. Check your Pi's architecture
uname -m   # should print: aarch64

# 2. On dev machine, rebuild for ARM64:
./scripts/build-for-pi.sh   # defaults to linux/arm64/v8

# 3. Transfer and reload
scp pi-images/meals-backend.tar pi-images/frontend-dist.tar.gz \
    pi@192.168.4.110:~/mealplanner/pi-images/
ssh pi@192.168.4.110
cd ~/mealplanner
./scripts/load-pi-images.sh
./scripts/pi-run.sh
```

---

### Issue 3: Deployment Hangs or Times Out

**Symptoms:** `deploy-podman.sh` hangs for 2 minutes then times out

**Cause:** Usually platform mismatch or podman-compose blocking on health checks

**Solutions:**
```bash
# 1. Check if containers were created but not started
podman ps -a

# 2. Try starting containers manually
podman start meals-postgres
sleep 5
podman logs meals-postgres

# 3. If platform mismatch, rebuild images for correct architecture
./scripts/check-platform.sh  # Check your architecture
# Then rebuild on dev machine with correct flag

# 4. Clean up and redeploy
podman-compose -f podman-compose.pi.yml down
podman rm -f meals-postgres meals-redis meals-backend meals-nginx 2>/dev/null || true
./scripts/pi-run.sh
```

---

### Issue 4: Containers Won't Start

**Symptoms:** `podman ps` shows no containers or containers keep restarting

**Solutions:**
```bash
# 1. Check logs for errors
podman-compose -f podman-compose.pi.yml logs

# 2. Verify images exist and check architecture
podman images | grep meals
./scripts/check-platform.sh

# 3. Check disk space
df -h /

# 4. If disk is full, cleanup
./scripts/cleanup-pi.sh

# 5. Try redeploying
./scripts/pi-run.sh
```

---

### Issue 5: Out of Memory

**Symptoms:** Containers crash, system becomes unresponsive

**Solutions:**
```bash
# 1. Check memory usage
free -h
podman stats

# 2. Restart containers to clear memory
./scripts/pi-bounce.sh

# 3. Increase swap (if needed)
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# 4. Verify swap
free -h
```

---

### Issue 6: High CPU Load

**Symptoms:** System is slow, CPU temperature high

**Solutions:**
```bash
# 1. Check CPU usage
top
htop  # if installed

# 2. Check temperature
vcgencmd measure_temp

# 3. Identify CPU-heavy processes
ps aux --sort=-%cpu | head -10

# 4. If temperature >70°C, improve cooling
# - Add heatsink
# - Add fan
# - Improve ventilation
```

---

### Issue 7: Database Connection Errors

**Symptoms:** Backend logs show "Cannot connect to database"

**Solutions:**
```bash
# 1. Check if postgres container is running
podman ps | grep postgres

# 2. Check postgres logs
podman logs meals-postgres

# 3. Verify database is healthy
podman exec meals-postgres pg_isready -U mealplanner

# 4. If not healthy, restart postgres
podman restart meals-postgres

# 5. Wait 10 seconds, then restart backend
sleep 10
podman restart meals-backend
```

---

### Issue 8: Port Already in Use

**Symptoms:** "Port 8080 already in use" error

**Solutions:**
```bash
# 1. Check what's using port 8080
sudo lsof -i :8080
# or
sudo netstat -tulpn | grep 8080

# 2. Option A: Stop the conflicting service
sudo systemctl stop <service-name>

# 3. Option B: Change port in podman-compose.pi.yml
# Edit the nginx ports section:
# ports:
#   - "8081:80"  # Change 8080 to 8081
```

---

### Issue 9: Images Not Loading

**Symptoms:** Deployment fails with "image not found" errors

**Solutions:**
```bash
# Verify images exist
podman images | grep meals

# If missing, re-run load script
./scripts/load-pi-images.sh
```

---

### Issue 10: Backend Container Fails

**Symptoms:** Backend container exits immediately or repeatedly restarts

**Solutions:**
```bash
# Check logs
podman logs meals-backend

# Common issues:
# - Database not ready: Wait 30s and check again
# - Secrets missing: Run ./scripts/generate-secrets.sh
# - Migration failed: Check database connectivity
```

---

## 🔧 Image Size Issues

### Problem: Backend Image Too Large

**Symptoms:** Backend container image ~1.2GB causing disk space issues on Raspberry Pi

**Root Cause:** The backend Dockerfile was copying the entire `.pnpm` directory from the builder stage, including ALL dependencies (devDependencies like TypeScript, @types/*, testing libraries, etc.).

**Solution Implemented:**

Instead of copying the Prisma client from the builder (which brings all dependencies), we now:
1. Install ONLY production dependencies in the final stage
2. Regenerate the Prisma client in the production stage with only prod dependencies
3. Add additional cleanup of temp files and caches

**Expected Results:**

**Before Fix:**
- Backend image: ~1.2GB
- Compressed transfer: ~408MB
- Uncompressed on Pi: ~1.2GB
- **Problem:** Not enough disk space to load on Pi with 88% disk usage

**After Fix:**
- Backend image: ~400-600MB (60-70% reduction)
- Compressed transfer: ~150-250MB (60% reduction)
- Uncompressed on Pi: ~400-600MB
- **Result:** Fits comfortably on Pi with room to spare

### Deployment Steps After Fix

**On Development Machine:**

1. **Rebuild the backend image with optimizations:**
   ```bash
   cd ~/mealplanner
   ./scripts/build-for-pi.sh
   ```

2. **Verify the new image size:**
   ```bash
   podman images | grep meals-backend
   # Should show ~400-600MB instead of ~1.2GB
   ```

3. **Transfer the new, smaller images to Pi:**
   ```bash
   scp pi-images/meals-backend.tar.gz pi@pihole.local:~/mealplanner/pi-images/
   ```

**On Raspberry Pi:**

1. **Clean up old images and free space:**
   ```bash
   cd ~/mealplanner
   
   # Remove the old backend image if it exists
   podman rmi localhost/meals-backend:latest 2>/dev/null || true
   
   # Clean up dangling images and containers
   podman system prune -f
   
   # Check available space
   df -h /
   ```

2. **Load the new optimized backend image:**
   ```bash
   gunzip -c ./pi-images/meals-backend.tar.gz | podman load
   ```

3. **Verify both images are loaded:**
   ```bash
   podman images | grep meals
   # Should show:
   # localhost/meals-backend   latest   ...   ~400-600MB
   ```

4. **Start the application:**
   ```bash
   ./scripts/pi-run.sh
   ```

---

## 🔨 Vite Rolldown Compatibility Fix

### Problem

When building the frontend on Raspberry Pi (ARM architecture with Alpine Linux), Vite 8.x fails with:

```
Error: Cannot find native binding. npm has a bug related to optional dependencies
Cannot find module '@rolldown/binding-linux-arm-musleabihf'
```

### Root Cause

- **Vite 8.x** introduced `rolldown` as the default bundler for better performance
- `rolldown` has limited platform support and doesn't include ARM Alpine Linux binaries
- The Raspberry Pi uses ARM architecture with Alpine Linux in Docker containers
- The missing native binding prevents the build from completing

### Solution

Force Vite to use `esbuild` instead of `rolldown` for ARM compatibility.

**1. Update `vite.config.ts`**

Changed the minifier from `terser` to `esbuild`:

```typescript
build: {
  minify: 'esbuild', // Use esbuild for ARM compatibility (rolldown not supported)
  // ... other options
}
```

**Trade-offs:**
- `esbuild` is faster than `terser` but produces slightly larger bundles
- For Raspberry Pi deployment, ARM compatibility is more important than minimal bundle size
- `esbuild` has excellent ARM support and is widely used in production

**2. Update `frontend/Dockerfile`**

Added environment variable to ensure esbuild usage:

```dockerfile
# Force Vite to use esbuild instead of rolldown for ARM compatibility
ENV VITE_USE_ESBUILD=true
```

### Verification

After applying these changes, the build should complete successfully on Raspberry Pi:

```bash
./scripts/build-on-pi.sh
```

Expected output:
```
✅ Images built successfully!
```

### Performance Impact

- **Build time**: esbuild is actually faster than rolldown on ARM
- **Bundle size**: ~5-10% larger than terser, but still acceptable
- **Runtime performance**: No impact, only affects build process

### Alternative Solutions Considered

1. **Downgrade Vite to 7.x**: Would work but loses new features and performance improvements
2. **Use cross-compilation**: Complex setup and doesn't solve the native binding issue
3. **Switch to webpack**: Major refactor, not worth it for this issue
4. **Wait for rolldown ARM support**: Unknown timeline, blocks deployment

### Future Considerations

When `rolldown` adds ARM Alpine Linux support, we can:
1. Remove the `VITE_USE_ESBUILD` environment variable
2. Consider switching back to `rolldown` for smaller bundles
3. Benchmark both options to determine the best choice

For now, `esbuild` provides the best balance of compatibility, speed, and bundle size for Raspberry Pi deployment.

---

## 🚑 Quick Recovery Steps

If you need to get the system running quickly:

```bash
cd ~/mealplanner

# 1. Stop everything
podman-compose -f podman-compose.pi.yml down

# 2. Regenerate secrets
./scripts/generate-secrets.sh

# 3. Start database first
podman-compose -f podman-compose.pi.yml up -d postgres

# 4. Wait for database to be ready
sleep 30

# 5. Start backend
podman-compose -f podman-compose.pi.yml up -d backend

# 6. Check logs immediately
podman logs -f meals-backend
```

---

## 📊 Collecting Diagnostic Information

If the issue persists, collect this information:

```bash
# System info
uname -a
free -h
df -h

# Podman info
podman version
podman info

# Container status
podman-compose -f podman-compose.pi.yml ps

# All container logs
podman logs meals-postgres > postgres.log 2>&1
podman logs meals-backend > backend.log 2>&1

# System logs
sudo journalctl -u podman --since "1 hour ago" > podman-system.log
```

---

## 🔍 Monitoring

After deployment, monitor:

```bash
# Disk usage
df -h /

# Container sizes
podman system df

# Image sizes
podman images

# Running containers
podman ps

# Memory usage
free -h

# CPU temperature
vcgencmd measure_temp
```

---

## 📝 Additional Optimizations

### Already Implemented
- ✅ Production dependencies only (`--prod` flag)
- ✅ pnpm cache cleanup
- ✅ npm cache cleanup  
- ✅ Compressed image transfers (gzip)
- ✅ Layer squashing (`--squash` flag)
- ✅ Multi-stage builds
- ✅ esbuild for ARM compatibility

### Future Optimizations (if needed)
- Use distroless or scratch base images (complex with Node.js)
- Implement image layer caching strategies
- Use external volume for node_modules
- Consider Alpine-based PostgreSQL client only

---

## 🆘 Next Steps

1. Run the diagnostic commands above
2. Check the logs for specific error messages
3. Apply the appropriate solution based on the error
4. If issue persists, provide the log output for further analysis

---

## 📚 Related Documentation

- [Raspberry Pi Deployment Guide](RASPBERRY_PI_DEPLOYMENT.md) - Complete deployment guide
- [Pi Optimization](PI_OPTIMIZATION.md) - Performance optimization guide
- [Main README](../README.md) - Project overview

---

**Last Updated:** 2026-05-20
**Version:** 2.0.0
**Maintained by:** Development Team

// Made with Bob