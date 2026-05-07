# Raspberry Pi Build Optimization Guide

## Overview

Building container images directly on Raspberry Pi can be slow due to ARM architecture and limited resources. However, **building directly on Pi is now the recommended approach** because:

1. **Cross-compilation from macOS to ARM64 has limitations** - macOS Docker/Podman struggles with proper ARM64 emulation
2. **Native ARM builds are more reliable** - Building on Pi ensures perfect compatibility
3. **Build cache makes it fast** - After the initial 2-hour build, incremental builds take only 5-10 minutes

This guide explains optimizations to reduce build times from 133+ minutes to under 10 minutes for incremental builds.

## Key Optimizations

### 1. Build Cache Usage

**Problem**: The original `build-on-pi.sh` used `--no-cache` flag, forcing complete rebuilds every time (133+ minutes).

**Solution**: Cache is now enabled by default. Only use `--no-cache` when necessary:

```bash
# Normal build (uses cache, ~5-10 minutes for incremental changes)
./scripts/build-on-pi.sh

# Clean build (no cache, ~120+ minutes)
NO_CACHE=true ./scripts/build-on-pi.sh
```

### 2. Image Location Fix

**Problem**: `pi-run.sh` expected images to be loaded from tar files, but `build-on-pi.sh` builds directly into Podman's local registry.

**Solution**: `pi-run.sh` now checks for images in Podman's registry regardless of how they were created (built locally or loaded from tar).

## Build Time Expectations

### First Build (No Cache)
- **Frontend dependencies**: 10-15 minutes
- **Frontend build**: 2-3 minutes  
- **Backend dependencies**: 5-7 minutes
- **Backend build**: 1-2 minutes
- **Prisma generation**: 1-2 minutes
- **Total**: ~120-130 minutes

### Incremental Builds (With Cache)
- **Code-only changes**: 2-5 minutes
- **Dependency changes**: 10-20 minutes
- **No changes**: <1 minute (cache hit)

## Workflow

### Option 1: Build Directly on Pi (Recommended)

```bash
# Clone/update code on Pi
cd ~/mealplanner
git pull

# Build images (uses cache)
./scripts/build-on-pi.sh

# Deploy
./scripts/pi-run.sh
```

**Pros**:
- **No cross-compilation issues** - Native ARM64 builds are more reliable
- **Automatic cache management** - Incremental builds are fast (5-10 min)
- **Simpler workflow** - No image transfer needed
- **Works from macOS** - macOS cross-compilation to ARM64 has known limitations

**Cons**:
- First build is slow (~2 hours)
- Uses Pi resources during build

**Why this is now recommended**: Previous attempts to cross-compile from macOS to ARM64 had compatibility issues. Building natively on Pi ensures perfect ARM64 compatibility and with build cache, subsequent builds are fast.

### Option 2: Build on Dev Machine, Transfer to Pi (Alternative)

```bash
# On Linux dev machine (NOT macOS - has ARM64 cross-compilation issues)
./scripts/build-for-pi.sh
./scripts/save-pi-images.sh

# Transfer to Pi
scp pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/

# On Pi
./scripts/load-pi-images.sh
./scripts/pi-run.sh
```

**Pros**:
- Faster builds on powerful dev machine
- Pi only loads pre-built images (~3 minutes)
- No build resource usage on Pi

**Cons**:
- **Does not work reliably from macOS** - ARM64 cross-compilation limitations
- Requires Linux dev machine with proper multi-arch support
- More complex workflow
- Transfer time for large images

**Note**: Only use this option if you have a Linux development machine. macOS users should build directly on Pi.

## Cache Management

### When to Clear Cache

Clear cache when:
- Dockerfile structure changes significantly
- Build issues occur that might be cache-related
- Base images are updated
- After major dependency updates

```bash
# Clear all build cache
podman system prune -a -f

# Then rebuild
NO_CACHE=true ./scripts/build-on-pi.sh
```

### Cache Storage

Build cache is stored in Podman's storage:
- Location: `/var/lib/containers/storage/` (rootful) or `~/.local/share/containers/storage/` (rootless)
- Size: Can grow to several GB
- Cleanup: Use `podman system prune` periodically

## Performance Monitoring

Build performance is logged to `build-performance-YYYYMMDD-HHMMSS.log`:

```bash
# View last build performance
cat build-performance-*.log | tail -20

# Identify slow stages
grep "Stage" build-performance-*.log
```

## Troubleshooting

### Build Fails with "slirp4netns failed"

This error occurred in your build log. It's typically a transient networking issue.

**Solutions**:
1. Retry the build (usually succeeds on second attempt)
2. Check network connectivity: `ping -c 3 registry.npmjs.org`
3. Restart Podman: `podman system reset` (WARNING: removes all containers/images)

### Build Hangs During pnpm Install

**Symptoms**: Progress stops at "resolved X, downloaded Y"

**Solutions**:
1. Wait 5-10 minutes (post-install scripts can be slow)
2. Check available memory: `free -h`
3. Increase swap if needed: `sudo dphys-swapfile swapoff && sudo dphys-swapfile swapon`

### Out of Disk Space

**Check space**:
```bash
df -h /
podman system df
```

**Free space**:
```bash
# Remove old images
podman image prune -a -f

# Remove build cache
podman system prune -a -f

# Clean up old backups
./scripts/cleanup-pi.sh
```

## Best Practices

1. **Use cache for development**: Only use `NO_CACHE=true` when troubleshooting
2. **Monitor disk space**: Keep at least 10GB free before building
3. **Build during off-hours**: First build takes 2+ hours
4. **Keep dependencies updated**: Run `pnpm update` periodically to avoid large dependency changes
5. **Use incremental builds**: Make small changes and rebuild frequently rather than large batches

## Architecture-Specific Notes

### ARM64 Compatibility

- **esbuild**: Uses native ARM64 binaries (fast)
- **Vite**: Configured to use esbuild minifier (not rolldown) for ARM compatibility
- **Node.js**: Official ARM64 images work well
- **Prisma**: Generates ARM64-compatible client automatically

### Memory Considerations

Raspberry Pi 4 (4GB RAM):
- **Frontend build**: Uses ~1.5GB peak
- **Backend build**: Uses ~800MB peak
- **Concurrent builds**: Not recommended (use sequential)

If builds fail with OOM:
1. Close other applications
2. Increase swap size
3. Build frontend and backend separately

## Related Documentation

- [Raspberry Pi Deployment Guide](./RASPBERRY_PI_DEPLOYMENT_GUIDE.md)
- [Container Size Optimization](./CONTAINER_SIZE_OPTIMIZATION.md)
- [ARM Compatibility](./ARM_COMPATIBILITY.md)

---

**Copyright (c) 2026 e2kd7n. All rights reserved.**