# Building Container Images Locally for Raspberry Pi

This guide explains how to build container images on your local development machine instead of on the Raspberry Pi, which is significantly faster.

## 🚀 Quick Start

### 1. Build Images Locally

On your development machine (Mac, Linux, or Windows with WSL):

```bash
# Make the script executable
chmod +x scripts/build-for-pi.sh

# Build images for ARM64 (Raspberry Pi)
./scripts/build-for-pi.sh
```

This will:
- Build both backend and frontend images for ARM64 architecture
- Save them as tar files in `./pi-images/` directory
- Display instructions for transferring to your Pi

### 2. Transfer Images to Raspberry Pi

Use SCP to transfer the images:

```bash
# Transfer images to your Pi
scp pi-images/*.tar pi@raspberrypi.local:~/mealplanner/pi-images/
```

Or use rsync for faster transfers with progress:

```bash
# Faster transfer with progress bar
rsync -avz --progress pi-images/ pi@raspberrypi.local:~/mealplanner/pi-images/
```

### 3. Load Images on Raspberry Pi

SSH into your Raspberry Pi and load the images:

```bash
# SSH to your Pi
ssh pi@raspberrypi.local

# Navigate to project directory
cd ~/mealplanner

# Make script executable
chmod +x scripts/load-pi-images.sh

# Load the pre-built images
./scripts/load-pi-images.sh
```

### 4. Deploy

Now deploy as usual:

```bash
./scripts/deploy-podman.sh
```

The deployment script will automatically detect the pre-built images and skip the build step!

## 📊 Performance Comparison

| Method | Time | Notes |
|--------|------|-------|
| Build on Pi | 15-30 min | Slow, resource intensive |
| Build locally + transfer | 3-5 min | Much faster, recommended |

## 🔧 Requirements

### On Your Development Machine

You need either:
- **Podman** (recommended) - supports multi-arch builds natively
- **Docker Desktop** - with BuildKit enabled for multi-arch support

#### Installing Podman

**macOS:**
```bash
brew install podman
podman machine init
podman machine start
```

**Linux:**
```bash
sudo apt-get install podman
```

**Windows (WSL2):**
```bash
sudo apt-get install podman
```

#### Using Docker

If using Docker, ensure BuildKit is enabled:

```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Or add to ~/.bashrc or ~/.zshrc
echo 'export DOCKER_BUILDKIT=1' >> ~/.bashrc
```

### On Raspberry Pi

- Podman installed (see `RASPBERRY_PI_QUICKSTART.md`)
- SSH access enabled
- Sufficient disk space (~2GB for images)

## 🎯 Advanced Usage

### Build Specific Image Only

Edit `scripts/build-for-pi.sh` and comment out the image you don't want to build:

```bash
# Build backend only
$CONTAINER_CMD build \
    --platform "$TARGET_ARCH" \
    -t meals-backend:latest \
    -f backend/Dockerfile \
    backend/

# Comment out frontend build
# $CONTAINER_CMD build ...
```

### Custom API URL for Frontend

Build frontend with custom API URL:

```bash
# Edit the build script or run manually
podman build \
    --platform linux/arm64 \
    -t meals-frontend:latest \
    --build-arg VITE_API_URL=http://your-pi-ip:3000/api \
    -f frontend/Dockerfile \
    frontend/
```

### Automated Transfer and Deploy

Create a one-liner to build, transfer, and deploy:

```bash
# On your development machine
./scripts/build-for-pi.sh && \
rsync -avz --progress pi-images/ pi@raspberrypi.local:~/mealplanner/pi-images/ && \
ssh pi@raspberrypi.local "cd ~/mealplanner && ./scripts/load-pi-images.sh && ./scripts/deploy-podman.sh"
```

## 🔍 Troubleshooting

### "exec format error" on Raspberry Pi

This means the image was built for the wrong architecture. Ensure you're building for `linux/arm64`:

```bash
# Check your build command includes:
--platform linux/arm64
```

### Images Too Large to Transfer

Compress the tar files before transfer:

```bash
# Compress images
gzip pi-images/*.tar

# Transfer compressed files
scp pi-images/*.tar.gz pi@raspberrypi.local:~/mealplanner/pi-images/

# On Pi, decompress before loading
gunzip pi-images/*.tar.gz
```

### Build Fails on macOS (Apple Silicon)

If you're on Apple Silicon (M1/M2/M3), you're already on ARM64! You can build natively:

```bash
# Build without --platform flag
podman build -t meals-backend:latest -f backend/Dockerfile backend/
podman build -t meals-frontend:latest -f frontend/Dockerfile frontend/
```

### Podman Machine Issues on macOS

If podman machine isn't working:

```bash
# Reset podman machine
podman machine stop
podman machine rm
podman machine init --cpus 4 --memory 4096
podman machine start
```

## 💡 Tips

1. **Build once, deploy many times**: Keep the tar files and reuse them across multiple Pi deployments
2. **Version your images**: Tag images with versions for easier rollback
3. **Use .dockerignore**: Ensure `.dockerignore` files are properly configured to reduce image size
4. **Cache layers**: Subsequent builds will be faster due to layer caching
5. **Network speed**: Use wired connection for faster transfers to Pi

## 🔄 CI/CD Integration

You can integrate this into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
name: Build for Raspberry Pi
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up QEMU
        uses: docker/setup-qemu-action@v2
      - name: Build images
        run: ./scripts/build-for-pi.sh
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: pi-images
          path: pi-images/
```

## 📚 Additional Resources

- [Podman Multi-Architecture Builds](https://podman.io/getting-started/multi-arch)
- [Docker BuildKit Documentation](https://docs.docker.com/build/buildkit/)
- [Raspberry Pi Documentation](https://www.raspberrypi.com/documentation/)

## 🆘 Need Help?

1. Check build logs: Look for errors during the build process
2. Verify architecture: `podman inspect meals-backend:latest | grep Architecture`
3. Test locally: If on ARM64 Mac, you can test the images locally first
4. Check disk space: Ensure both machines have sufficient space

Happy building! 🏗️

---

Made with Bob