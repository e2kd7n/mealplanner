# Podman and Docker Compatibility Guide

**Last Updated:** 2026-04-28

This document summarizes the Podman and Docker compatibility updates made across the mealplanner codebase to ensure users can choose either container runtime.

---

## 📋 Overview

The mealplanner application now fully supports both **Podman** and **Docker** as container runtimes. All documentation and scripts have been updated to reference both tools where appropriate.

### Why Both?

- **Podman**: Recommended for Raspberry Pi deployments (rootless, lighter weight)
- **Docker**: Popular choice for development machines, especially with Docker Desktop
- **Flexibility**: Users can choose based on their environment and preferences

---

## ✅ Files Updated

### Root Documentation

| File | Changes Made |
|------|-------------|
| `README.md` | Added deployment section mentioning both Podman/Docker containers |
| `DEPLOYMENT.md` | Comprehensive update with installation options for both runtimes, including compose tool setup |

### Documentation Files (docs/)

| File | Changes Made |
|------|-------------|
| `LOCAL_DEVELOPMENT.md` | Added Docker installation instructions alongside Podman, with command examples for both |
| `SECRETS_MANAGEMENT.md` | Updated to reference both `podman-compose` and `docker-compose` |
| `DATABASE_BACKUP.md` | Updated troubleshooting commands to include both `podman` and `docker` |

### Scripts (scripts/)

| File | Status |
|------|--------|
| `generate-secrets.sh` | ✅ Updated - Now mentions both compose tools |
| `build-for-pi.sh` | ✅ Already compatible - Auto-detects Podman or Docker |
| `cleanup-dev-machine.sh` | ✅ Already compatible - Auto-detects Podman or Docker |
| Other Pi scripts | ℹ️ Podman-specific (intentional for Pi deployment) |

---

## 🔧 Key Compatibility Patterns

### 1. Installation Instructions

All documentation now provides clear options:

```markdown
**Option A: Podman (Recommended for Raspberry Pi)**
```bash
sudo apt-get install -y podman
```

**Option B: Docker**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```
```

### 2. Compose Tool References

Updated from single-tool to dual-tool references:

**Before:**
```bash
podman-compose up -d
```

**After:**
```bash
# Using Podman
podman-compose up -d

# Using Docker
docker-compose up -d
```

### 3. Container Commands

Troubleshooting sections now show both:

```bash
# Check containers
podman ps | grep meals-postgres
# or
docker ps | grep meals-postgres

# View logs
podman logs meals-postgres
# or
docker logs meals-postgres
```

---

## 📝 Command Reference

### Common Operations

| Operation | Podman | Docker |
|-----------|--------|--------|
| **Build image** | `podman build -t name .` | `docker build -t name .` |
| **Run container** | `podman run name` | `docker run name` |
| **List containers** | `podman ps` | `docker ps` |
| **View logs** | `podman logs name` | `docker logs name` |
| **Start services** | `podman-compose up -d` | `docker-compose up -d` |
| **Stop services** | `podman-compose down` | `docker-compose down` |
| **View compose logs** | `podman-compose logs -f` | `docker-compose logs -f` |

---

## 🎯 Recommendations by Environment

### Development Machine (macOS/Windows/Linux)
- **Recommended**: Either Podman or Docker
- **Reason**: Both work well, choose based on preference
- **Docker Desktop**: Convenient GUI option for macOS/Windows

### Raspberry Pi Deployment
- **Recommended**: Podman
- **Reason**: Lighter weight, rootless operation, better for constrained resources
- **Note**: All Pi-specific scripts use Podman

### CI/CD Pipelines
- **Recommended**: Docker
- **Reason**: Better CI/CD integration, more common in cloud environments

---

## 🔍 Auto-Detection Scripts

These scripts automatically detect and use the available container runtime:

1. **`scripts/build-for-pi.sh`**
   - Checks for `podman` first, falls back to `docker`
   - Works seamlessly with either tool

2. **`scripts/cleanup-dev-machine.sh`**
   - Detects available runtime
   - Uses appropriate commands automatically

---

## 📚 Documentation Structure

### User-Facing Documentation
All user-facing docs now mention both options:
- Installation guides show both Podman and Docker
- Command examples include both variants
- Troubleshooting covers both tools

### Internal/Archive Documentation
Historical docs in `docs/archive/` retain original references for context but are not actively maintained for dual compatibility.

---

## ⚠️ Important Notes

### Compose File Compatibility
- `podman-compose.yml` works with both `podman-compose` and `docker-compose`
- `podman-compose.pi.yml` is Podman-specific for Raspberry Pi
- Syntax is compatible between both tools (Docker Compose v3.8 spec)

### Image Compatibility
- Images built with Podman work with Docker and vice versa
- Both use OCI (Open Container Initiative) standard
- Platform-specific builds (ARM vs x86) handled by both tools

### Volume Persistence
- Both tools create persistent volumes
- Volume names may differ slightly (podman adds prefix)
- Data is preserved across container restarts with both

---

## 🚀 Getting Started

### For New Users

1. **Choose your runtime:**
   - Development: Either Podman or Docker
   - Raspberry Pi: Podman (recommended)

2. **Follow installation guide:**
   - See `DEPLOYMENT.md` for detailed instructions
   - See `docs/LOCAL_DEVELOPMENT.md` for development setup

3. **Use appropriate commands:**
   - Replace `podman` with `docker` in commands as needed
   - Replace `podman-compose` with `docker-compose` as needed

### For Existing Users

- **No changes required** if you're already using Podman
- **Documentation now supports** your choice of Docker if preferred
- **Scripts remain compatible** with your current setup

---

## 📞 Support

If you encounter issues with either runtime:

1. Check the specific tool's documentation:
   - [Podman Documentation](https://docs.podman.io/)
   - [Docker Documentation](https://docs.docker.com/)

2. Review our troubleshooting guides:
   - `docs/RASPBERRY_PI_DEPLOYMENT_TROUBLESHOOTING.md`
   - `docs/LOCAL_DEVELOPMENT.md`

3. Verify your installation:
   ```bash
   podman --version  # or docker --version
   podman-compose --version  # or docker-compose --version
   ```

---

## 🔄 Migration Between Runtimes

### From Docker to Podman

```bash
# Export images from Docker
docker save meals-backend:latest | gzip > backend.tar.gz
docker save meals-frontend:latest | gzip > frontend.tar.gz

# Import to Podman
gunzip -c backend.tar.gz | podman load
gunzip -c frontend.tar.gz | podman load

# Use podman-compose instead of docker-compose
pip3 install podman-compose
podman-compose up -d
```

### From Podman to Docker

```bash
# Export images from Podman
podman save meals-backend:latest | gzip > backend.tar.gz
podman save meals-frontend:latest | gzip > frontend.tar.gz

# Import to Docker
gunzip -c backend.tar.gz | docker load
gunzip -c frontend.tar.gz | docker load

# Use docker-compose instead of podman-compose
docker-compose up -d
```

---

## ✨ Summary

The mealplanner codebase now provides:
- ✅ Full documentation for both Podman and Docker
- ✅ Auto-detecting scripts where possible
- ✅ Clear recommendations by environment
- ✅ Consistent command examples
- ✅ Flexible deployment options

Choose the tool that works best for your environment and follow the updated documentation for a smooth experience!

---

**Made with Bob** 🤖