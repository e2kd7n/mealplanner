# ARM Architecture Compatibility Guide

This document outlines all ARM-specific configurations and potential issues when building on Raspberry Pi.

## Fixed Issues

### 1. ✅ pnpm Installation
**Problem:** pnpm's install script doesn't support ARM v7 (32-bit)
**Solution:** Use `npm install -g pnpm@9` instead of corepack or install script
**Location:** All Dockerfiles

### 2. ✅ Vite/Rolldown Bundler
**Problem:** Vite 8 defaults to Rolldown which lacks ARM binaries
**Solution:** Set `ENV VITE_USE_ROLLUP=true` to force Rollup bundler
**Location:** backend/Dockerfile (frontend-builder stage), frontend/Dockerfile

### 3. ✅ Prisma Client Generation
**Problem:** Prisma may not find pre-built ARM binaries
**Solution:** Set `ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1`
**Location:** backend/Dockerfile (backend-builder and production stages)

### 4. ✅ Native Module Compilation (bcrypt, etc.)
**Problem:** Native modules need to be compiled for ARM
**Solution:** 
- Build stage: Install `python3 make g++ gcc` for node-gyp
- Runtime stage: Install `libstdc++ libgcc` for native module runtime
**Location:** backend/Dockerfile

## Dependencies with Native Binaries

### Backend Dependencies
- **bcrypt@6.0.0** - Requires compilation, handled by build tools
- **@prisma/client@6.19.3** - Uses PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING workaround
- **jsdom@25.0.1** - May have canvas dependencies, monitored

### Frontend Dependencies
- **esbuild@0.27.4** - Used for minification, should have ARM support
- All other dependencies are pure JavaScript

## Build Performance Notes

### Expected Build Times on Raspberry Pi 4
- Frontend dependencies install: ~8-10 minutes
- Frontend build (Vite): ~2-3 minutes
- Backend dependencies install: ~5-7 minutes
- Backend TypeScript compilation: ~1-2 minutes
- Total: ~20-25 minutes

### Optimization Tips
1. Use `--no-cache` sparingly - caching can speed up rebuilds
2. Network speed affects dependency download times
3. Consider building on a faster machine and copying images if frequent rebuilds needed

## Monitoring for Issues

### Signs of ARM Compatibility Problems
1. **Missing native bindings** - Error mentions `linux-arm-musleabihf` or `linux-arm64`
2. **Module not found** - Native module can't load compiled binary
3. **Segmentation faults** - Native code crashes on ARM
4. **EAI_AGAIN warnings** - DNS timeouts (normal on Pi, will retry)

### How to Debug
1. Check if package has ARM support: `npm view <package> cpu os`
2. Look for alternative packages with better ARM support
3. Check package's GitHub issues for ARM-related problems
4. Consider using Docker buildx for cross-compilation if needed

## Future Considerations

### If Upgrading Dependencies
- **Vite 9+** - Check if Rolldown ARM support improves
- **pnpm 10+** - May have better ARM support via corepack
- **esbuild** - Keep updated for latest ARM optimizations
- **Prisma** - Monitor for native ARM binary releases

### Alternative Approaches
1. **Cross-compilation** - Build on x86_64 with `--platform linux/arm/v7`
2. **Pre-built images** - Build once, push to registry, pull on Pi
3. **Hybrid approach** - Build frontend on x86_64, backend on Pi

## Testing Checklist

Before deploying to production:
- [ ] All dependencies install without errors
- [ ] Frontend builds successfully with Rollup
- [ ] Backend compiles TypeScript without errors
- [ ] Prisma client generates correctly
- [ ] Native modules (bcrypt) work at runtime
- [ ] Application starts and responds to health checks
- [ ] No segmentation faults or crashes under load

## Resources

- [Node.js ARM Support](https://nodejs.org/en/download/)
- [Prisma ARM Deployment](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Vite Rollup vs Rolldown](https://github.com/vitejs/vite/discussions/13816)
- [pnpm ARM Issues](https://github.com/pnpm/pnpm/issues?q=is%3Aissue+arm)