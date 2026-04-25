# Raspberry Pi Deployment - Correct Workflow

## Expert Analysis: Why Building on Pi Fails

**Root Cause:** Raspberry Pi's Podman has strict seccomp (secure computing mode) restrictions that block syscalls required by Node.js package managers (npm, pnpm, corepack). This causes "container exited on bad system call" errors during image builds.

**Solution:** Build images on a development machine with proper multi-arch support, then transfer pre-built images to the Pi.

## The Correct Deployment Workflow

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

## Key Files

### podman-compose.pi.yml
**Purpose:** Pi-specific compose file that uses pre-built images only (no build directives)

**Why it exists:** The standard `podman-compose.yml` has `build:` sections that trigger image building. On Pi, we must use pre-built images, so this file removes all build directives.

### podman-compose.yml
**Purpose:** Development/build compose file with build directives

**When to use:** Only on development machines where you can build images

## Common Mistakes to Avoid

### ❌ DON'T: Run build scripts on Raspberry Pi
```bash
# WRONG - This will fail with syscall errors
./scripts/pi-build-manual.sh
```

### ❌ DON'T: Use podman-compose.yml on Pi
```bash
# WRONG - This tries to build images
podman-compose -f podman-compose.yml up -d
```

### ✅ DO: Use the correct workflow
```bash
# On dev machine
./scripts/build-for-pi.sh

# Transfer images
scp pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/

# On Pi
./scripts/load-pi-images.sh
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