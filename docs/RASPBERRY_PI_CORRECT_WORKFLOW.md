# Raspberry Pi Deployment - Workflow Options

**Last Updated:** 2026-05-06

## Recommended Approach: Build Directly on Pi

**Building directly on the Raspberry Pi is now the recommended approach** because:

1. **macOS cross-compilation to ARM64 has limitations** - Docker/Podman on macOS struggles with proper ARM64 emulation, leading to compatibility issues
2. **Native ARM builds are more reliable** - Building on Pi ensures perfect ARM64 compatibility
3. **Build cache makes it fast** - After the initial 2-hour build, incremental builds take only 5-10 minutes
4. **Simpler workflow** - No image transfer or cross-compilation setup needed

## Two Deployment Approaches

### Option 1: Build Directly on Pi (Recommended - Works from macOS)
**Pros:** No cross-compilation issues, automatic cache management, works from macOS
**Cons:** First build is slow (~2 hours), uses Pi resources during build

### Option 2: Build on Linux Dev Machine, Transfer to Pi (Alternative)
**Pros:** Faster builds on powerful dev machine, Pi only loads images (~3 minutes)
**Cons:** **Does not work from macOS** (ARM64 cross-compilation issues), requires Linux dev machine, more complex workflow

**Important**: If you're developing on macOS, you must use Option 1 (build on Pi). Option 2 only works reliably from Linux development machines with proper multi-arch support.

## Workflow Option 1: Build Directly on Pi

### Step 1: Clone/Update Code on Pi

```bash
ssh pi@pihole.local
cd ~/mealplanner
git pull  # or git clone if first time
```

### Step 2: Build Images on Pi

```bash
# Build with cache (5-10 minutes for incremental changes)
./scripts/build-on-pi.sh

# Or force clean build if needed (120+ minutes)
NO_CACHE=true ./scripts/build-on-pi.sh
```

**Build Time Expectations:**
- First build (no cache): ~120-130 minutes
- Incremental builds (with cache): 5-10 minutes
- Code-only changes: 2-5 minutes

### Step 3: Deploy Application

```bash
./scripts/pi-run.sh
```

**See [PI_BUILD_OPTIMIZATION.md](./PI_BUILD_OPTIMIZATION.md) for detailed build optimization guide.**

---

## Workflow Option 2: Build on Dev Machine, Transfer to Pi

### Step 1: Build Images on Development Machine

On your **development machine** (Mac/Linux/Windows with Docker/Podman):

```bash
cd ~/mealplanner
./scripts/build-for-pi.sh
```

This creates ARM64 images in `./pi-images/`:
- `meals-backend.tar.gz` (~416MB compressed)
- `meals-frontend.tar.gz` (~24MB compressed)

### Step 2: Transfer Images to Raspberry Pi

Transfer the compressed images:

```bash
# Using SCP (recommended)
scp pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/

# Or using rsync (faster, resumable)
rsync -avz --progress pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/
```

### Step 3: Load Images on Raspberry Pi

SSH into your Raspberry Pi:

```bash
ssh pi@pihole.local
cd ~/mealplanner
./scripts/load-pi-images.sh
```

This script:
- Decompresses and loads images into Podman
- Verifies images are loaded correctly
- Cleans up tar files to save space

### Step 4: Deploy Application

```bash
./scripts/deploy-podman.sh
```

Or use the simpler run script:

```bash
./scripts/pi-run.sh
```

## Choosing the Right Workflow

### Use Option 1 (Build on Pi) When:
- You're actively developing and testing on Pi
- You want simpler workflow with fewer steps
- You have time for initial 2-hour build
- You're making frequent small changes (cache makes rebuilds fast)

### Use Option 2 (Build on Dev Machine) When:
- You're deploying to production
- You want fastest possible deployment on Pi
- You have a powerful dev machine for building
- You're deploying to multiple Pis

## Key Files

### podman-compose.pi.yml
**Purpose:** Pi-specific compose file that uses pre-built images only (no build directives)

**Why it exists:** The standard `podman-compose.yml` has `build:` sections that trigger image building. On Pi, we can now build locally OR use pre-built images.

### podman-compose.yml
**Purpose:** Development/build compose file with build directives

**When to use:** On development machines where you can build images

## Common Mistakes to Avoid

### ❌ DON'T: Use `--no-cache` unnecessarily
```bash
# WRONG - Forces slow rebuild every time (120+ minutes)
NO_CACHE=true ./scripts/build-on-pi.sh  # Only use when troubleshooting
```

### ❌ DON'T: Use podman-compose.yml on Pi
```bash
# WRONG - This tries to build images with wrong compose file
podman-compose -f podman-compose.yml up -d
```

### ✅ DO: Use build cache for development
```bash
# CORRECT - Fast incremental builds (5-10 minutes)
./scripts/build-on-pi.sh
```

### ✅ DO: Use the right compose file
```bash
# CORRECT - Uses pre-built images
podman-compose -f podman-compose.pi.yml up -d
# Or simply use:
./scripts/pi-run.sh
```

## Pi-Specific Scripts

All Pi scripts now use `podman-compose.pi.yml`:

- **pi-run.sh** - Start application
- **pi-stop.sh** - Stop application  
- **pi-bounce.sh** - Restart application
- **deploy-podman.sh** - Full deployment (checks for pre-built images)

## Troubleshooting

### "Pre-built images not found"

**Problem:** You tried to deploy without loading images first

**Solution:**
```bash
# Check if images exist
podman images | grep meals

# If not, load them
./scripts/load-pi-images.sh
```

### "Container exited on bad system call"

**Problem:** You're trying to build on the Pi

**Solution:** Don't build on Pi. Use the correct workflow above.

### Images exist but deployment fails

**Problem:** Using wrong compose file

**Solution:** Ensure scripts use `podman-compose.pi.yml`:
```bash
# Check which compose file is being used
grep "podman-compose" scripts/pi-*.sh
```

## Architecture Notes

### Why Multi-Stage Builds Work on Dev Machines

Development machines (x86_64/ARM64 Mac) have:
- Full syscall support in containers
- Better seccomp profiles
- More resources for building

### Why They Fail on Raspberry Pi

Raspberry Pi has:
- Restricted seccomp profiles for security
- Limited resources (4GB RAM)
- Syscall restrictions that block package manager operations

### The Solution: Pre-Built Images

By building on a capable machine and transferring images:
- ✅ Bypass Pi's syscall restrictions
- ✅ Faster deployment (no build time on Pi)
- ✅ Less resource usage on Pi
- ✅ More reliable deployments

## Quick Reference

```bash
# Development Machine Workflow
./scripts/build-for-pi.sh
scp pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/

# Raspberry Pi Workflow  
./scripts/load-pi-images.sh
./scripts/pi-run.sh

# Management Commands (on Pi)
./scripts/pi-stop.sh      # Stop services
./scripts/pi-bounce.sh    # Restart services
./scripts/pi-diagnostics.sh  # Check system health
```

## Summary

**The Golden Rule:** Never build container images on Raspberry Pi. Always build on a development machine and transfer pre-built images.

This approach is:
- More reliable (no syscall issues)
- Faster (build once, deploy many times)
- More efficient (Pi resources saved for running, not building)
- Industry standard (CI/CD builds, production deploys)

# Made with Bob