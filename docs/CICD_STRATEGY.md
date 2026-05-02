# CI/CD Strategy for Raspberry Pi Deployment

This document outlines strategies to avoid rebuilding containers on the Raspberry Pi for every change.

## Problem Statement

Building containers on Raspberry Pi takes 20-25 minutes due to:
- Limited CPU power (ARM architecture)
- Slower I/O compared to modern SSDs
- Memory constraints during compilation

## Solution: Build Once, Deploy Everywhere

### Strategy Overview

1. **Build on GitHub Actions** (fast x86_64 runners with cross-compilation)
2. **Push to Container Registry** (GitHub Container Registry or Docker Hub)
3. **Pull on Raspberry Pi** (download pre-built images in ~2-3 minutes)

---

## Option 1: GitHub Actions + GitHub Container Registry (RECOMMENDED)

### Advantages
- Free for public repos, generous limits for private repos
- Integrated with GitHub (no additional accounts needed)
- Supports multi-architecture builds (ARM + x86_64)
- Automatic builds on push/PR
- Image caching for faster builds

### Implementation

#### 1. Create GitHub Actions Workflow

**File:** `.github/workflows/build-and-push.yml`

```yaml
name: Build and Push Container Images

on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'
      - 'frontend/**'
      - 'nginx/**'
      - '**/Dockerfile'
      - '.github/workflows/build-and-push.yml'
  pull_request:
    branches: [main]
  workflow_dispatch: # Manual trigger

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ${{ github.repository_owner }}/mealplanner

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    strategy:
      matrix:
        include:
          - image: backend
            dockerfile: backend/Dockerfile
            context: .
          - image: frontend
            dockerfile: frontend/Dockerfile
            context: frontend
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}-${{ matrix.image }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ${{ matrix.context }}
          file: ${{ matrix.dockerfile }}
          platforms: linux/arm/v7,linux/arm64,linux/amd64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            VITE_API_URL=/api
```

#### 2. Update Raspberry Pi Deployment Script

**File:** `scripts/pi-deploy-from-registry.sh`

```bash
#!/bin/bash

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
REGISTRY="ghcr.io"
REPO_OWNER="your-github-username"
IMAGE_TAG="${1:-latest}"

echo -e "${GREEN}🚀 Deploying from container registry...${NC}"
echo -e "${BLUE}Registry: ${REGISTRY}${NC}"
echo -e "${BLUE}Tag: ${IMAGE_TAG}${NC}"

# Login to registry (if private)
if [ -n "$GITHUB_TOKEN" ]; then
    echo "$GITHUB_TOKEN" | podman login $REGISTRY -u $REPO_OWNER --password-stdin
fi

# Pull images
echo -e "${YELLOW}📥 Pulling backend image...${NC}"
podman pull $REGISTRY/$REPO_OWNER/mealplanner-backend:$IMAGE_TAG

echo -e "${YELLOW}📥 Pulling frontend image...${NC}"
podman pull $REGISTRY/$REPO_OWNER/mealplanner-frontend:$IMAGE_TAG

# Tag as latest for local use
podman tag $REGISTRY/$REPO_OWNER/mealplanner-backend:$IMAGE_TAG meals-backend:latest
podman tag $REGISTRY/$REPO_OWNER/mealplanner-frontend:$IMAGE_TAG meals-frontend:latest

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
podman-compose -f podman-compose.pi.yml down || true

# Start new containers
echo -e "${YELLOW}🚀 Starting containers...${NC}"
podman-compose -f podman-compose.pi.yml up -d

echo -e "${GREEN}✅ Deployment complete!${NC}"
```

#### 3. Set Up GitHub Token on Pi

```bash
# Create token at: https://github.com/settings/tokens
# Permissions needed: read:packages

# On Raspberry Pi:
export GITHUB_TOKEN="your_token_here"
echo "export GITHUB_TOKEN='your_token_here'" >> ~/.bashrc
```

#### 4. Deploy Workflow

```bash
# On Raspberry Pi:
git pull
./scripts/pi-deploy-from-registry.sh latest

# Or deploy specific version:
./scripts/pi-deploy-from-registry.sh v1.2.3
```

---

## Option 2: Docker Hub (Alternative)

### Advantages
- More familiar to many developers
- Larger free tier for public images
- Good documentation and tooling

### Implementation

Similar to Option 1, but:
- Use `docker.io` as registry
- Use Docker Hub credentials
- Update workflow to use Docker Hub login

---

## Option 3: Hybrid Approach (Development)

For rapid development cycles:

### Hot Reload for Backend
```yaml
# podman-compose.dev.yml
services:
  backend:
    volumes:
      - ./backend/src:/app/src:ro
      - ./backend/dist:/app/dist
    command: pnpm dev  # Uses nodemon for auto-reload
```

### Hot Reload for Frontend
```yaml
services:
  frontend:
    volumes:
      - ./frontend/src:/app/src:ro
    command: pnpm dev
    ports:
      - "5173:5173"
```

**Usage:**
```bash
# Development mode (no rebuild needed for code changes)
podman-compose -f podman-compose.dev.yml up

# Production mode (use pre-built images)
./scripts/pi-deploy-from-registry.sh
```

---

## Build Time Comparison

| Method | Time | When to Use |
|--------|------|-------------|
| Build on Pi | 20-25 min | Initial setup only |
| Pull from registry | 2-3 min | Every deployment |
| Hot reload (dev) | Instant | Active development |

---

## Optimization Strategies

### 1. Layer Caching
GitHub Actions caches Docker layers between builds:
```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

### 2. Multi-Stage Builds
Already implemented in Dockerfiles - only final stage is pushed.

### 3. Conditional Builds
Only build when relevant files change:
```yaml
paths:
  - 'backend/**'
  - 'frontend/**'
```

### 4. Parallel Builds
Build backend and frontend simultaneously using matrix strategy.

### 5. Incremental Deployments
Only rebuild changed services:
```bash
# Only backend changed
podman pull ghcr.io/user/mealplanner-backend:latest
podman-compose up -d backend

# Only frontend changed  
podman pull ghcr.io/user/mealplanner-frontend:latest
podman-compose up -d frontend
```

---

## Rollback Strategy

### Quick Rollback
```bash
# Deploy previous version
./scripts/pi-deploy-from-registry.sh v1.2.2

# Or use commit SHA
./scripts/pi-deploy-from-registry.sh main-abc123
```

### Automated Rollback
Add health checks to deployment script:
```bash
# Wait for health check
for i in {1..30}; do
    if curl -f http://localhost:3000/health; then
        echo "✅ Deployment successful"
        exit 0
    fi
    sleep 2
done

echo "❌ Health check failed, rolling back..."
./scripts/pi-deploy-from-registry.sh $PREVIOUS_VERSION
```

---

## Security Considerations

### 1. Private Registry
For private repos, use GitHub Container Registry with authentication.

### 2. Image Scanning
Add vulnerability scanning to workflow:
```yaml
- name: Scan image
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}-${{ matrix.image }}:latest
    format: 'sarif'
    output: 'trivy-results.sarif'
```

### 3. Signed Images
Use Docker Content Trust or Cosign for image signing.

---

## Cost Analysis

### GitHub Container Registry
- **Public repos:** Free unlimited
- **Private repos:** 500MB free, then $0.25/GB/month
- **Bandwidth:** Free for public, included in GitHub Actions minutes for private

### Docker Hub
- **Free tier:** 1 private repo, unlimited public
- **Pro:** $5/month for unlimited private repos

### Recommendation
Use GitHub Container Registry for seamless integration with existing GitHub workflow.

---

## Migration Path

### Phase 1: Set Up CI/CD (Week 1)
1. Create GitHub Actions workflow
2. Test builds on GitHub Actions
3. Verify multi-arch support

### Phase 2: Registry Integration (Week 1)
1. Push images to registry
2. Test pulling on Pi
3. Update deployment scripts

### Phase 3: Production Deployment (Week 2)
1. Deploy from registry to production
2. Monitor performance
3. Document process

### Phase 4: Optimization (Ongoing)
1. Analyze build times
2. Optimize layer caching
3. Implement hot reload for development

---

## Troubleshooting

### Build Fails on ARM
- Check QEMU setup in workflow
- Verify platform specification
- Review ARM compatibility fixes in Dockerfiles

### Pull Fails on Pi
- Check network connectivity
- Verify authentication token
- Check registry URL and image name

### Container Won't Start
- Check logs: `podman logs meals-backend`
- Verify environment variables
- Check health endpoint

---

## Next Steps

1. **Immediate:** Set up GitHub Actions workflow
2. **Short-term:** Migrate to registry-based deployment
3. **Long-term:** Implement hot reload for development

This approach reduces deployment time from 25 minutes to 2-3 minutes - a **90% improvement**! 🚀