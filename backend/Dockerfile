# Multi-stage build for Node.js backend with integrated frontend
# Optimized for ARM architecture (Raspberry Pi) with minimal size
#
# Build stages:
#   [1/3] frontend-builder - Builds the React frontend application
#   [2/3] backend-builder  - Builds the Node.js backend, generates Prisma client,
#                            and prunes to production-only dependencies
#   [3/3] production       - Final image — no pnpm, no build tools, no devDeps
#
# pnpm@11 blocks build scripts by default. onlyBuiltDependencies in the lockfile
# settings section explicitly approves the packages that need native compilation
# or postinstall hooks (bcrypt, Prisma). This setting is read by every pnpm
# invocation including subprocess calls from prisma generate.

# ============================================================================
# STAGE 1/3: Frontend Builder
# ============================================================================
FROM docker.io/library/node:22-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package.json frontend/pnpm-lock.yaml ./

RUN npm install -g pnpm@10 --quiet

RUN pnpm install --frozen-lockfile --prod=false

COPY frontend ./

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Force Vite to use Rollup instead of Rolldown (Rolldown does not support ARM)
ENV VITE_USE_ROLLUP=true

RUN pnpm build

# ============================================================================
# STAGE 2/3: Backend Builder
# ============================================================================
FROM docker.io/library/node:22-alpine AS backend-builder

# Build tools required by bcrypt's native module (node-gyp → python3/make/gcc)
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

COPY backend/package.json backend/pnpm-lock.yaml ./

RUN npm install -g pnpm@10 --quiet

# onlyBuiltDependencies in the lockfile settings allows bcrypt and Prisma
# packages to run their install scripts; all others remain blocked.
RUN pnpm install --frozen-lockfile

COPY backend .

# PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 lets Prisma run on ARM where
# pre-built engine binaries may not match the checksum exactly.
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Generate Prisma client, compile TypeScript, strip devDeps.
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

# libstdc++ and libgcc are required by bcrypt's native module at runtime
RUN apk add --no-cache libstdc++ libgcc && \
    rm -rf /var/cache/apk/*

# Production node_modules (devDeps pruned, bcrypt binary compiled, no pnpm)
COPY --from=backend-builder /app/node_modules ./node_modules

# Compiled TypeScript output
COPY --from=backend-builder /app/dist ./dist

# Prisma schema — needed for `prisma migrate deploy` at container startup
COPY --from=backend-builder /app/prisma ./prisma

COPY backend/package.json ./

# Frontend static files (served by the backend in non-Pi deployments)
COPY --from=frontend-builder /frontend/dist ./public

COPY backend/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN mkdir -p /app/uploads /app/backups /app/images && \
    chmod +x /app/docker-entrypoint.sh

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
