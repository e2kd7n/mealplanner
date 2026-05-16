# Multi-stage build for Node.js backend with integrated frontend
# Optimized for ARM architecture (Raspberry Pi) with minimal size
#
# Build stages:
#   [1/3] frontend-builder - Builds the React frontend application
#   [2/3] backend-builder  - Builds the Node.js backend, generates Prisma client,
#                            and prunes to production-only dependencies
#   [3/3] production       - Final image — no pnpm, no build tools, no devDeps

# ============================================================================
# STAGE 1/3: Frontend Builder
# ============================================================================
FROM docker.io/library/node:22-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package.json frontend/pnpm-lock.yaml ./

# pnpm version must match local dev environment (lockfile was generated with pnpm@11)
RUN npm install -g pnpm@11 --quiet

RUN pnpm install --frozen-lockfile --prod=false

COPY frontend ./

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Force Vite to use Rollup instead of Rolldown (Rolldown doesn't support ARM)
ENV VITE_USE_ROLLUP=true

RUN pnpm build

# ============================================================================
# STAGE 2/3: Backend Builder
# ============================================================================
FROM docker.io/library/node:22-alpine AS backend-builder

# Build tools required for native modules (bcrypt uses node-gyp)
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

COPY backend/package.json backend/pnpm-lock.yaml ./

RUN npm install -g pnpm@11 --quiet

# Install all dependencies (dev + prod) — needed for prisma generate and tsc
RUN pnpm install --frozen-lockfile

COPY backend .

# PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING allows Prisma to run on ARM
# without pre-built binaries for every variant
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Generate Prisma client, compile TypeScript, then prune devDependencies.
# pnpm prune --prod removes devDeps from node_modules in-place, preserving
# the generated .prisma/client directory (it is not an npm package, so pnpm
# does not touch it during pruning).
RUN pnpm prisma generate && \
    pnpm build && \
    pnpm prune --prod && \
    pnpm store prune && \
    rm -rf /root/.local/share/pnpm/store /tmp/* /root/.cache /root/.npm

# ============================================================================
# STAGE 3/3: Production Image
# ============================================================================
FROM docker.io/library/node:22-alpine

WORKDIR /app

# Runtime libraries only — bcrypt needs libstdc++/libgcc at runtime
RUN apk add --no-cache libstdc++ libgcc && \
    rm -rf /var/cache/apk/*

# Production node_modules (pruned to prod deps by builder, no pnpm needed here)
COPY --from=backend-builder /app/node_modules ./node_modules

# Compiled TypeScript output
COPY --from=backend-builder /app/dist ./dist

# Prisma schema (needed for migrate deploy at startup)
COPY --from=backend-builder /app/prisma ./prisma

# package.json referenced by some runtime tooling
COPY backend/package.json ./

# Frontend static files (served by backend in non-Pi deployments)
COPY --from=frontend-builder /frontend/dist ./public

# Runtime directories and entrypoint
COPY backend/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN mkdir -p /app/uploads /app/backups /app/images && \
    chmod +x /app/docker-entrypoint.sh

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
