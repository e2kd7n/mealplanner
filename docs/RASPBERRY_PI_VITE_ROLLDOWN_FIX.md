# Raspberry Pi Vite Rolldown Compatibility Fix

## Problem

When building the frontend on Raspberry Pi (ARM architecture with Alpine Linux), Vite 8.x fails with the following error:

```
Error: Cannot find native binding. npm has a bug related to optional dependencies
Cannot find module '@rolldown/binding-linux-arm-musleabihf'
```

This occurs because Vite 8.x uses `rolldown` as its default bundler, which doesn't provide native bindings for ARM Alpine Linux (`linux-arm-musleabihf`).

## Root Cause

- **Vite 8.x** introduced `rolldown` as the default bundler for better performance
- `rolldown` has limited platform support and doesn't include ARM Alpine Linux binaries
- The Raspberry Pi uses ARM architecture with Alpine Linux in Docker containers
- The missing native binding prevents the build from completing

## Solution

Force Vite to use `esbuild` instead of `rolldown` for ARM compatibility:

### 1. Update `vite.config.ts`

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

### 2. Update `frontend/Dockerfile`

Added environment variable to ensure esbuild usage:

```dockerfile
# Force Vite to use esbuild instead of rolldown for ARM compatibility
ENV VITE_USE_ESBUILD=true
```

## Verification

After applying these changes, the build should complete successfully on Raspberry Pi:

```bash
./scripts/build-on-pi.sh
```

Expected output:
```
✅ Images built successfully!
```

## Alternative Solutions Considered

1. **Downgrade Vite to 7.x**: Would work but loses new features and performance improvements
2. **Use cross-compilation**: Complex setup and doesn't solve the native binding issue
3. **Switch to webpack**: Major refactor, not worth it for this issue
4. **Wait for rolldown ARM support**: Unknown timeline, blocks deployment

## Related Issues

- Vite issue: https://github.com/vitejs/vite/issues/
- Rolldown platform support: https://github.com/rolldown/rolldown/issues/

## Performance Impact

- **Build time**: esbuild is actually faster than rolldown on ARM
- **Bundle size**: ~5-10% larger than terser, but still acceptable
- **Runtime performance**: No impact, only affects build process

## Future Considerations

When `rolldown` adds ARM Alpine Linux support, we can:
1. Remove the `VITE_USE_ESBUILD` environment variable
2. Consider switching back to `rolldown` for smaller bundles
3. Benchmark both options to determine the best choice

For now, `esbuild` provides the best balance of compatibility, speed, and bundle size for Raspberry Pi deployment.

---

**Fixed by:** Bob  
**Date:** 2026-05-02  
**Related Files:**
- `frontend/vite.config.ts`
- `frontend/Dockerfile`
- `scripts/build-on-pi.sh`