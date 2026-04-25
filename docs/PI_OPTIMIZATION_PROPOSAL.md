# Raspberry Pi 4 Optimization Proposal
**Platform:** Raspberry Pi 4 Model B (1.8GB RAM, 4-core ARM64)  
**Current State:** Development system with containers not running  
**Analysis Date:** April 24, 2026

---

## Executive Summary

The Pi 4 shows healthy baseline metrics but reveals several optimization opportunities for running a containerized meal planning application. With only 1.8GB RAM and containers currently offline, strategic optimizations are critical before production deployment.

**Key Findings:**
- Memory: 353MB used (18.3%) - acceptable but will spike with containers
- Disk: 17GB/28GB used (61%) - manageable but trending toward capacity
- CPU Load: 4.35 average - concerning for 4-core system (>100% utilization)
- Temperature: 58.4°C - acceptable but monitor under load
- Swap Usage: 114MB/511MB (22%) - indicates memory pressure

---

## Critical Issues

### 1. High CPU Load Average (Priority: CRITICAL)
**Current:** 4.35, 4.37, 4.00 (1m, 5m, 15m)  
**Expected:** <2.0 for 4-core system

**Root Cause Analysis:**
- Load >4.0 on 4-core system indicates sustained oversubscription
- Podman consuming 24.7% CPU while containers are stopped (abnormal)
- Desktop environment (labwc, Xwayland, pcmanfm) consuming ~7% combined
- Multiple kworker threads active (events_unbound)

**Recommendations:**
```bash
# 1. Run headless - disable desktop environment
sudo systemctl set-default multi-user.target
# Saves: ~150MB RAM, ~10% CPU

# 2. Investigate podman daemon CPU usage
# NOTE: See "Safe Podman Cleanup Strategy" section below
# DO NOT run cleanup before deploying your images!

# 3. Optimize kernel worker threads
# Add to /boot/firmware/cmdline.txt:
# workqueue.power_efficient=1

# 4. Install and monitor with sysstat
sudo apt-get install sysstat
# Enable in /etc/default/sysstat
```
### Safe Podman Cleanup Strategy

**⚠️ TIMING IS CRITICAL: When to run cleanup**

1. **BEFORE first deployment:** Only if you have old/test images to remove
2. **AFTER successful deployment:** To remove old versions when updating
3. **NEVER during deployment:** Will delete images you're about to use!

**IMPORTANT: Verify Pi-hole's container runtime first:**

Based on your diagnostics, Pi-hole is running as `/usr/bin/pihole-FTL` (native systemd service), which means it does NOT use Podman. This makes Podman cleanup completely safe from affecting Pi-hole.

```bash
# Verify Pi-hole is native install (not containerized)
systemctl status pihole-FTL  # Should show active
podman ps -a | grep -i pihole  # Should return nothing
docker ps 2>/dev/null | grep -i pihole  # Should return nothing
```

**Safe cleanup options (in order of safety):**

1. **Safest - Check what exists first:**
```bash
# See what's currently using space
podman system df

# List all images
podman image ls

# List all containers (including stopped)
podman ps -a

# List all volumes
podman volume ls
```

2. **Safe - Remove only stopped containers and dangling images:**
```bash
# This won't touch running containers or tagged images
podman system prune
# Answer 'y' when prompted
# Safe because: Only removes stopped containers, unused networks, dangling images
```

3. **More aggressive (safe since Pi-hole is native):**
```bash
# Removes all unused images (not just dangling)
podman system prune -a
# Safe because: Pi-hole doesn't use Podman
```

4. **Most aggressive (use with caution):**
```bash
# Only use if you want to completely reset Podman
# This removes ALL images, containers, volumes, networks
podman system prune -a --volumes

# Nuclear option - complete reset
podman system reset
```

**Recommended workflow for deployment:**

```bash
# BEFORE DEPLOYMENT (optional, only if cleaning up old stuff)
# Step 1: Check what exists
podman system df
podman image ls
podman ps -a

# Step 2: Only cleanup if you see old/unwanted images
# This removes unused images but keeps anything tagged
podman system prune

# DEPLOY YOUR APPLICATION
# (Load images with load-pi-images.sh or build them)
# (Start containers with pi-run.sh)

# AFTER SUCCESSFUL DEPLOYMENT (for maintenance)
# Step 3: Remove old versions when updating
podman image prune  # Only removes dangling images
# OR for more aggressive cleanup:
# podman system prune -a  # Removes all unused images

# Step 4: Verify everything still works
curl -I http://localhost/admin  # Pi-hole
curl -I http://localhost  # Your app
systemctl status pihole-FTL
podman ps  # Should show your running containers
```

**Safe cleanup for ongoing maintenance:**
```bash
# Weekly: Remove stopped containers and dangling images
podman system prune

# Monthly: More aggressive cleanup (keeps running containers)
podman system prune -a

# Before updates: Remove old image versions
podman image ls  # Check what you have
podman image rm <old-image-id>  # Remove specific old versions
```

**Why this is safe for your Pi:**
- Pi-hole runs as native systemd service (`pihole-FTL`)
- No Pi-hole containers found in diagnostics
- Podman and Docker are separate container runtimes
- Your diagnostics show 0 running containers in Podman

### Build-Time Disk Space Issues

**Common culprits during container builds on Pi:**

1. **Podman/Buildah build cache** - Can consume 5-10GB
2. **npm/pnpm cache** - 500MB-2GB per project
3. **Intermediate build layers** - 2-3x final image size
4. **Journal logs** - Can grow to 1GB+ during builds

**Diagnostic commands to find space hogs:**
```bash
# Check Podman storage usage
podman system df -v

# Find largest directories
du -h --max-depth=2 /var | sort -hr | head -20

# Check build cache specifically
du -sh ~/.local/share/containers/storage/
du -sh /var/lib/containers/storage/

# Check npm/pnpm cache
du -sh ~/.npm
du -sh ~/.local/share/pnpm/store

# Check journal size
journalctl --disk-usage

# Check for incomplete layers (your diagnostics showed one)
podman system df -v | grep -i incomplete
```

**Pre-build cleanup strategy:**
```bash
# 1. Clear journal logs (can save 500MB-1GB)
sudo journalctl --vacuum-size=50M
sudo journalctl --vacuum-time=7d

# 2. Clear package manager caches
npm cache clean --force
pnpm store prune  # If using pnpm

# 3. Clear Podman build cache (safe, will rebuild from scratch)
podman system prune -a --volumes
# This removes:
# - All stopped containers
# - All unused images
# - All unused volumes
# - All build cache

# 4. Remove incomplete layers (your diagnostics found one)
podman system reset  # Nuclear option if prune doesn't work

# 5. Check available space before building
df -h /
```

**Build optimization to reduce disk usage:**

```dockerfile
# backend/Dockerfile - Optimized for space
FROM node:20-alpine AS builder

# Use build args to control cache
ARG BUILDKIT_INLINE_CACHE=1

WORKDIR /app

# Copy only package files first (better layer caching)
COPY package*.json pnpm-lock.yaml ./

# Install with minimal cache
RUN npm install -g pnpm && \
    pnpm config set store-dir /tmp/pnpm-store && \
    pnpm install --frozen-lockfile --prod && \
    rm -rf /tmp/pnpm-store

COPY . .

# Build and cleanup in same layer
RUN pnpm build && \
    pnpm prune --prod && \
    rm -rf .npm /tmp/*

# Final stage - minimal size
FROM node:20-alpine
RUN apk add --no-cache tini && \
    rm -rf /var/cache/apk/*

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER node
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
```

**Alternative: Build on another machine, transfer images**

If disk space is too tight for building:
```bash
# On development machine (with more disk space)
podman build --platform linux/arm64 -t meals-backend:latest ./backend
podman build --platform linux/arm64 -t meals-frontend:latest ./frontend
podman save meals-backend:latest meals-frontend:latest | gzip > mealplanner-images.tar.gz

# Transfer to Pi (much smaller than building)
scp mealplanner-images.tar.gz pi@pihole:~/

# On Pi - load pre-built images
gunzip -c mealplanner-images.tar.gz | podman load
```

**Monitor disk usage during build:**
```bash
# Run in separate terminal during build
watch -n 5 'df -h / && echo "---" && podman system df'
```

**Emergency disk space recovery:**
```bash
# If build fails due to disk space
sudo journalctl --vacuum-size=10M  # Aggressive journal cleanup
sudo apt-get clean  # Clear apt cache
sudo apt-get autoremove  # Remove unused packages
rm -rf ~/.cache/*  # Clear user caches
podman system prune -a --volumes --force  # Nuclear cleanup

# Check what's using space
sudo du -h --max-depth=1 /var | sort -hr
sudo du -h --max-depth=1 /home | sort -hr
```

**Recommended build workflow for Pi:**
```bash
# 1. Pre-build cleanup
sudo journalctl --vacuum-size=50M
podman system prune -a --volumes
df -h /  # Should show >5GB free

# 2. Build with monitoring
watch -n 5 'df -h /' &
WATCH_PID=$!
podman-compose build

# 3. Kill monitoring
kill $WATCH_PID

# 4. Post-build cleanup
podman image prune  # Remove dangling layers
```



### 2. Memory Constraints (Priority: HIGH)
**Current:** 1.5GB available, but 114MB swap already in use

**Container Memory Projections:**
- PostgreSQL: ~150-200MB
- Backend (Node.js): ~200-300MB  
- Frontend (nginx): ~50-100MB
- **Total Estimated:** 400-600MB minimum

**Available after containers:** ~900MB-1.1GB (tight margin)

**Recommendations:**
```yaml
# podman-compose.yml memory limits
services:
  db:
    mem_limit: 256m
    mem_reservation: 128m
    
  backend:
    mem_limit: 384m
    mem_reservation: 256m
    environment:
      - NODE_OPTIONS=--max-old-space-size=256
    
  frontend:
    mem_limit: 128m
    mem_reservation: 64m
```

```bash
# Increase swap to 2GB for safety margin
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### 3. Disk Space Management (Priority: MEDIUM)
**Current:** 17GB/28GB (61%) with no containers running

**Breakdown:**
- `/var`: 5.7GB (likely logs, container storage)
- `/home`: 4.7GB
- `/usr`: 4.6GB

**Recommendations:**
```bash
# 1. Aggressive log rotation
cat > /etc/logrotate.d/mealplanner << 'EOF'
/var/log/mealplanner/*.log {
    daily
    rotate 3
    compress
    delaycompress
    missingok
    notifempty
    maxsize 50M
}
EOF

# 2. Journal size limits
sudo journalctl --vacuum-size=100M
sudo sed -i 's/#SystemMaxUse=/SystemMaxUse=100M/' /etc/systemd/journald.conf

# 3. Container storage optimization
# Add to /etc/containers/storage.conf:
[storage.options]
size = "5G"  # Limit container storage pool
```

---

## Application-Specific Optimizations

### 4. Container Image Optimization (Priority: HIGH)

**Current Issues:**
- Images not built yet, but typical Node.js images are 800MB-1.2GB
- Multi-stage builds essential for ARM64

**Recommended Dockerfile Strategy:**

```dockerfile
# backend/Dockerfile.pi
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile --prod

COPY . .
RUN pnpm build && \
    pnpm prune --prod

FROM node:20-alpine
RUN apk add --no-cache tini
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER node
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
```

**Expected Savings:**
- Base image: 800MB → 180MB (Alpine vs Debian)
- Multi-stage: Removes build tools (~200MB)
- **Total:** ~60-70% size reduction

### 5. Database Optimization (Priority: HIGH)

```sql
-- PostgreSQL tuning for 1.8GB RAM system
-- Add to postgresql.conf or via environment variables

shared_buffers = 128MB          # 25% of available container memory
effective_cache_size = 384MB    # 75% of available container memory
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 4MB
default_statistics_target = 100
random_page_cost = 1.1          # SSD/SD card optimization
effective_io_concurrency = 200
work_mem = 4MB                  # Low to prevent OOM
min_wal_size = 1GB
max_wal_size = 2GB
max_connections = 20            # Limit connections
```

```bash
# Regular maintenance cron job
cat > /etc/cron.daily/pg-maintenance << 'EOF'
#!/bin/bash
podman exec mealplanner-db psql -U postgres -d mealplanner -c "VACUUM ANALYZE;"
podman exec mealplanner-db psql -U postgres -d mealplanner -c "REINDEX DATABASE mealplanner;"
EOF
chmod +x /etc/cron.daily/pg-maintenance
```

### 6. Application Code Optimizations (Priority: MEDIUM)

**Backend (Node.js):**
```javascript
// backend/src/config/performance.ts
export const performanceConfig = {
  // Limit concurrent operations
  maxConcurrentRequests: 10,
  
  // Aggressive caching
  cacheConfig: {
    ttl: 3600,
    max: 100,  // Limit cache size
    updateAgeOnGet: true
  },
  
  // Connection pooling
  database: {
    max: 5,      // Reduced from typical 10-20
    min: 1,
    idle: 10000,
    acquire: 30000
  },
  
  // Image processing limits
  imageProcessing: {
    maxConcurrent: 2,
    maxSize: 2 * 1024 * 1024,  // 2MB
    quality: 75  // Reduce quality for storage
  }
};
```

**Frontend (React):**
```typescript
// frontend/vite.config.ts optimizations
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material']
        }
      }
    },
    chunkSizeWarningLimit: 500,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
```

### 7. Network & Service Optimization (Priority: MEDIUM)

**Current Services Analysis:**
- Pi-hole FTL: 66MB RAM, 1% CPU (acceptable)
- VNC server (port 5900): Unnecessary for headless
- Docker daemon: 13MB RAM (not used, remove)

```bash
# Disable unnecessary services
sudo systemctl disable docker
sudo systemctl stop docker
sudo systemctl disable vncserver-x11-serviced
sudo systemctl stop vncserver-x11-serviced

# Optimize network stack for local use
cat >> /etc/sysctl.conf << 'EOF'
# Network optimizations for Pi
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 87380 67108864
net.ipv4.tcp_wmem = 4096 65536 67108864
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq
EOF
sudo sysctl -p
```

### 8. Monitoring & Alerting (Priority: MEDIUM)

```bash
# Install lightweight monitoring
sudo apt-get install prometheus-node-exporter

# Create alert script
cat > /usr/local/bin/pi-health-check.sh << 'EOF'
#!/bin/bash
TEMP=$(vcgencmd measure_temp | cut -d= -f2 | cut -d\' -f1)
MEM=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
DISK=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')

if (( $(echo "$TEMP > 70" | bc -l) )); then
    echo "ALERT: Temperature critical: ${TEMP}°C"
fi

if [ "$MEM" -gt 85 ]; then
    echo "ALERT: Memory usage critical: ${MEM}%"
fi

if [ "$DISK" -gt 80 ]; then
    echo "ALERT: Disk usage critical: ${DISK}%"
fi
EOF
chmod +x /usr/local/bin/pi-health-check.sh

# Add to crontab
echo "*/5 * * * * /usr/local/bin/pi-health-check.sh" | crontab -
```

---

## Implementation Roadmap

### Phase 1: Immediate (Before Container Deployment)
1. ✅ Disable desktop environment (saves 150MB RAM, 10% CPU)
2. ✅ Increase swap to 2GB
3. ✅ Remove Docker daemon
4. ✅ Configure log rotation
5. ✅ Install sysstat for monitoring

**Expected Impact:** +200MB RAM, -15% CPU load

### Phase 2: Container Preparation (Week 1)
1. ✅ Build Alpine-based images with multi-stage builds
2. ✅ Set memory limits in podman-compose.yml
3. ✅ Configure PostgreSQL for low-memory environment
4. ✅ Implement connection pooling limits
5. ✅ Test container startup and resource usage

**Expected Impact:** Images <300MB total, predictable memory usage

### Phase 3: Application Optimization (Week 2)
1. ✅ Implement aggressive caching strategy
2. ✅ Optimize image processing pipeline
3. ✅ Add request rate limiting
4. ✅ Configure frontend code splitting
5. ✅ Set up health monitoring

**Expected Impact:** -30% response time, +40% throughput

### Phase 4: Long-term Monitoring (Ongoing)
1. ✅ Weekly performance reviews
2. ✅ Monthly database maintenance
3. ✅ Quarterly dependency updates
4. ✅ Continuous optimization based on metrics

---

## Performance Targets

| Metric | Current | Target | Critical |
|--------|---------|--------|----------|
| CPU Load (1m) | 4.35 | <2.0 | >3.5 |
| Memory Usage | 18% | <70% | >85% |
| Swap Usage | 22% | <30% | >60% |
| Disk Usage | 61% | <75% | >85% |
| Temperature | 58°C | <65°C | >75°C |
| API Response | N/A | <200ms | >1000ms |

---

## Risk Assessment

### High Risk
- **Memory exhaustion:** Containers + Pi-hole + desktop = potential OOM killer
  - *Mitigation:* Headless mode, memory limits, swap increase
  
- **CPU saturation:** Current 4.35 load before containers
  - *Mitigation:* Disable unnecessary services, optimize code

### Medium Risk
- **Disk space:** 61% usage trending upward
  - *Mitigation:* Aggressive log rotation, image cleanup

- **SD card wear:** Frequent writes can degrade performance
  - *Mitigation:* Log to tmpfs, reduce write frequency

### Low Risk
- **Network bandwidth:** Local network should be sufficient
- **Temperature:** Current 58°C with headroom

---

## Cost-Benefit Analysis

### Option A: Optimize Current Pi 4 (1.8GB)
**Cost:** 40 hours development time  
**Benefit:** Functional but constrained system  
**Risk:** Limited headroom for growth

### Option B: Upgrade to Pi 4 (4GB) or Pi 5
**Cost:** $55-80 hardware + 8 hours migration  
**Benefit:** 2-4x memory, better performance  
**Risk:** Minimal

### Recommendation
Implement Phase 1-2 optimizations immediately. If memory pressure persists after container deployment, upgrade to 4GB Pi 4 ($55) for 2.2x memory increase. The optimization work is valuable regardless and will benefit any hardware.

---

## Monitoring Dashboard

```bash
# Quick status check command
alias pi-status='echo "=== Pi Status ===" && \
  vcgencmd measure_temp && \
  free -h | grep Mem && \
  df -h / | tail -1 && \
  uptime && \
  podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Size}}"'
```

---

## Conclusion

The Pi 4 (1.8GB) can run this application with careful optimization, but operates near capacity limits. The high CPU load (4.35) is the most concerning metric and must be addressed before container deployment. Implementing the Phase 1 optimizations will provide sufficient headroom for initial deployment, with the option to upgrade hardware if user load increases.

**Next Steps:**
1. Execute Phase 1 optimizations (2 hours)
2. Build and test optimized container images (4 hours)
3. Deploy with monitoring (2 hours)
4. Evaluate performance under realistic load (1 week)
5. Make upgrade decision based on metrics

**Total Estimated Effort:** 20-40 hours depending on optimization depth
**Expected Outcome:** Functional system with 20-30% resource headroom