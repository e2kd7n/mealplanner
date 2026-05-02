# Lightweight Container Images for Raspberry Pi

## Current Implementation

The application currently uses Alpine Linux base images, which are already optimized for size:
- `node:20-alpine` (~180MB base)
- `postgres:16-alpine` (~240MB base)
- `nginx:alpine` (~40MB base)

## Alternative Lighter Options

### 1. Distroless Images (Most Secure, Smallest)

**Pros:**
- Minimal attack surface (no shell, package manager)
- Smallest possible size (~50MB for Node.js)
- Better security posture

**Cons:**
- Harder to debug (no shell access)
- Requires careful dependency management
- More complex build process

**Example:**
```dockerfile
FROM gcr.io/distroless/nodejs20-debian12:latest
# Size: ~50MB vs 180MB Alpine
```

### 2. Scratch Images (Absolute Minimum)

**Pros:**
- Absolutely minimal (only your app + runtime)
- Maximum performance

**Cons:**
- Very difficult to build
- No debugging tools
- Requires static compilation

**Not recommended for this application** due to complexity.

### 3. BusyBox Images (Lightweight with Tools)

**Pros:**
- Smaller than Alpine (~5MB base)
- Includes basic Unix tools
- Good for debugging

**Cons:**
- Less package availability
- More manual setup required

## Recommendation: Stick with Alpine

**Why Alpine is the best choice for this project:**

1. **Already Optimized**: Alpine is only ~5MB base, Node Alpine is ~180MB (mostly Node.js itself)
2. **Package Availability**: Full apk package manager with most needed packages
3. **Debugging**: Shell access for troubleshooting on Pi
4. **Community Support**: Well-documented, widely used
5. **Build Simplicity**: Works with existing Dockerfiles

## Further Optimization Strategies

### 1. Multi-Stage Build Optimization (Already Implemented)
- ✅ Separate builder and runtime stages
- ✅ Only copy necessary artifacts
- ✅ Remove build dependencies from final image

### 2. Layer Optimization (Implemented)
- ✅ Combine RUN commands to reduce layers
- ✅ Clean up caches in same layer
- ✅ Order commands by change frequency

### 3. Dependency Optimization
```dockerfile
# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Remove unnecessary files
RUN rm -rf /root/.npm /root/.cache /tmp/*
```

### 4. Node.js Optimization
```dockerfile
# Use production mode
ENV NODE_ENV=production

# Optimize V8 for low memory
ENV NODE_OPTIONS="--max-old-space-size=256 --optimize-for-size"
```

## Size Comparison

| Image Type | Base Size | With App | Total |
|------------|-----------|----------|-------|
| node:20 (Debian) | 1.1GB | +200MB | 1.3GB |
| node:20-alpine | 180MB | +200MB | 380MB |
| node:20-slim | 240MB | +200MB | 440MB |
| distroless/nodejs20 | 50MB | +200MB | 250MB |

**Current Implementation**: 380MB (Alpine) - Good balance
**Potential with Distroless**: 250MB - 34% smaller but harder to debug

## Implementation Status

✅ **Current**: Alpine-based images (optimal for Pi)
- Backend: ~400MB (includes frontend)
- Frontend: ~50MB (nginx + React)
- Database: ~240MB (PostgreSQL)

🔄 **Future Consideration**: Distroless for production
- Would require separate debug images
- More complex CI/CD pipeline
- Marginal benefit (~130MB savings) vs complexity

## Conclusion

**Alpine Linux is the recommended base image** for Raspberry Pi deployment because:
1. Already very lightweight
2. Easy to debug and maintain
3. Good package availability
4. Well-tested and documented
5. Minimal complexity overhead

The current implementation is already optimized. Further size reductions would require significant complexity with minimal benefit for a self-hosted Pi deployment.

## Related Documentation
- [PI_OPTIMIZATION_PROPOSAL.md](PI_OPTIMIZATION_PROPOSAL.md) - Overall Pi optimization strategy
- [RASPBERRY_PI_DEPLOYMENT.md](RASPBERRY_PI_DEPLOYMENT.md) - Deployment guide
- [IMAGE_OPTIMIZATION.md](IMAGE_OPTIMIZATION.md) - Frontend image optimization