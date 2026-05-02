# Multi-stage build for Node.js backend with integrated frontend
# Optimized for ARM architecture (Raspberry Pi) with minimal size
#
# Build stages:
#   [1/3] frontend-builder - Builds the React frontend application
#   [2/3] backend-builder  - Builds the Node.js backend and TypeScript
#   [3/3] production       - Final optimized image with only runtime dependencies

# ============================================================================
# STAGE 1/3: Frontend Builder
# ============================================================================
# Purpose: Build the React frontend application
# Output: Compiled static files in /frontend/dist
FROM docker.io/library/node:20-alpine AS frontend-builder

WORKDIR /frontend

# Copy frontend package files
COPY frontend/package.json frontend/pnpm-lock.yaml ./

# Enable corepack and install pnpm (works on all architectures including ARM)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install frontend dependencies (production only)
RUN pnpm install --frozen-lockfile --prod=false

# Copy frontend source code
COPY frontend ./

# Build argument for API URL
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Build the frontend application
RUN pnpm build

# ============================================================================
# STAGE 2/3: Backend Builder
# ============================================================================
# Purpose: Build the Node.js backend and compile TypeScript
# Output: Compiled JavaScript in /app/dist and Prisma client
FROM docker.io/library/node:20-alpine AS backend-builder

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

# Copy package files
COPY backend/package.json backend/pnpm-lock.yaml ./

# Enable corepack and install pnpm (works on all architectures including ARM)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY backend .

# Generate Prisma client with ARM workaround
# Use dummy DATABASE_URL for build time (will be replaced at runtime)
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN pnpm prisma generate

# Build TypeScript
RUN pnpm build

# ============================================================================
# STAGE 3/3: Production Image (OPTIMIZED FOR SIZE)
# ============================================================================
# Purpose: Create minimal production image with only runtime dependencies
# Optimizations:
#   - Production dependencies only (no TypeScript, @types/*, etc.)
#   - Regenerated Prisma client (avoids copying dev dependencies)
#   - Cleaned caches and temporary files
# Expected size: 400-600MB (vs 1.2GB with dev dependencies)
FROM docker.io/library/node:20-alpine

WORKDIR /app

# Enable corepack and install pnpm (works on all architectures including ARM)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY backend/package.json backend/pnpm-lock.yaml ./

# Copy prisma schema before installing dependencies
COPY --from=backend-builder /app/prisma ./prisma

# Install ONLY production dependencies and generate Prisma client in one layer
# This reduces image size by combining operations
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN pnpm install --frozen-lockfile --prod && \
    pnpm add -D prisma@6.19.3 --ignore-workspace && \
    ./node_modules/.bin/prisma generate && \
    pnpm remove prisma --ignore-workspace && \
    pnpm store prune && \
    rm -rf /root/.local/share/pnpm/store /tmp/* /var/cache/apk/* /root/.npm /root/.cache && \
    npm cache clean --force

# Copy built backend from builder
COPY --from=backend-builder /app/dist ./dist

# Copy built frontend from frontend-builder
COPY --from=frontend-builder /frontend/dist ./public

# Create directories and copy entrypoint in one layer
COPY backend/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN mkdir -p /app/uploads /app/backups /app/images && \
    chmod +x /app/docker-entrypoint.sh

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start application using entrypoint script
ENTRYPOINT ["/app/docker-entrypoint.sh"]