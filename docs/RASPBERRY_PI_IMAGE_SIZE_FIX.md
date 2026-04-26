# Raspberry Pi Image Size Fix

**Date:** April 25, 2026  
**Issue:** Backend container image too large (~1.2GB) causing disk space issues on Raspberry Pi  
**Target:** Reduce to 400-600MB as specified in CONTAINER_SIZE_OPTIMIZATION.md

## Root Cause

The backend Dockerfile was copying the entire `.pnpm` directory from the builder stage, which included ALL dependencies (including devDependencies like TypeScript, @types/*, testing libraries, etc.) even though the production stage correctly used `pnpm install --prod`.

### Problematic Code (Line 76-82)
```dockerfile
# Copy generated Prisma client from builder (pnpm structure)
COPY --from=backend-builder /app/node_modules/.pnpm ./node_modules/.pnpm
```

This copied ~600-800MB of unnecessary development dependencies into the final image.

## Solution Implemented

Instead of copying the Prisma client from the builder (which brings all dependencies), we now:
1. Install ONLY production dependencies in the final stage
2. Regenerate the Prisma client in the production stage with only prod dependencies
3. Add additional cleanup of temp files and caches

### Fixed Code (Line 76-85)
```dockerfile
# Copy prisma schema
COPY --from=backend-builder /app/prisma ./prisma

# Regenerate Prisma client with production dependencies only
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Clean up pnpm cache and store to save space
RUN pnpm store prune && \
    rm -rf /root/.local/share/pnpm/store && \
    rm -rf /tmp/* /var/cache/apk/*
```

## Expected Results

### Before Fix
- Backend image: ~1.2GB
- Compressed transfer: ~408MB
- Uncompressed on Pi: ~1.2GB
- **Problem:** Not enough disk space to load on Pi with 88% disk usage

### After Fix
- Backend image: ~400-600MB (60-70% reduction)
- Compressed transfer: ~150-250MB (60% reduction)
- Uncompressed on Pi: ~400-600MB
- **Result:** Should fit comfortably on Pi with room to spare

## Deployment Steps

### On Development Machine

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
   # Frontend image is already loaded on Pi, no need to retransfer
   ```

### On Raspberry Pi

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
   # localhost/meals-frontend  latest   ...   ~50-80MB
   ```

4. **Start the application:**
   ```bash
   ./scripts/pi-run.sh
   ```

## Additional Optimizations Considered

### Already Implemented
- ✅ Production dependencies only (`--prod` flag)
- ✅ pnpm cache cleanup
- ✅ npm cache cleanup  
- ✅ Compressed image transfers (gzip)
- ✅ Layer squashing (`--squash` flag)
- ✅ Multi-stage builds

### Future Optimizations (if needed)
- Use distroless or scratch base images (complex with Node.js)
- Implement image layer caching strategies
- Use external volume for node_modules
- Consider Alpine-based PostgreSQL client only

## Monitoring

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
```

## References

- [CONTAINER_SIZE_OPTIMIZATION.md](./CONTAINER_SIZE_OPTIMIZATION.md) - Original optimization plan
- [PI_OPTIMIZATION_PROPOSAL.md](./PI_OPTIMIZATION_PROPOSAL.md) - Pi-specific optimizations
- [RASPBERRY_PI_DEPLOYMENT_GUIDE.md](./RASPBERRY_PI_DEPLOYMENT_GUIDE.md) - Complete deployment guide