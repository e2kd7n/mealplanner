# Multi-stage build for Node.js backend with integrated frontend
# Target runtime: linux/arm64 (Raspberry Pi 4B / Zero W)
#
# Build stage architecture:
#   [1/3] frontend-builder  amd64  — Vite/Rollup has broken ARM binaries; output is JS
#   [2/3] backend-builder   amd64  — pnpm/tsc/prisma are QEMU-hostile; output is JS
#   [3/3] production        arm64  — final runtime image for the Pi
#
# Stages 1 and 2 run on the native amd64 GitHub runner (no QEMU). Stage 3
# inherits the target platform from `docker buildx --platform linux/arm64`.
#
# pnpm@11 blocks build scripts by default. onlyBuiltDependencies in the lockfile
# settings section explicitly approves the packages that need native compilation
# or postinstall hooks (bcrypt, Prisma). This setting is read by every pnpm
# invocation including subprocess calls from prisma generate.

# ============================================================================
# STAGE 1/3: Frontend Builder  [BUILD ARCH: amd64]
# Pinned to amd64: Rolldown does not support ARM; Rollup's ARM binary is
# unreliable under QEMU. JS/CSS output is platform-independent.
# ============================================================================
FROM --platform=linux/amd64 docker.io/library/node:22-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package.json frontend/pnpm-lock.yaml ./

RUN npm install -g pnpm@10 --quiet

RUN pnpm install --no-frozen-lockfile --prod=false

COPY frontend ./

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Force Vite to use Rollup instead of Rolldown (Rolldown does not support ARM)
ENV VITE_USE_ROLLUP=true

RUN pnpm build

# ============================================================================
# STAGE 2/3: Backend Builder  [BUILD ARCH: amd64]
# Pinned to amd64: pnpm install, tsc, and prisma generate are all
# QEMU-hostile — 10-20x slower under ARM emulation. Compiled JS and the
# Prisma client are platform-independent. bcrypt's native .node binary will
# be amd64 here; it is recompiled for arm64 in the production stage below.
# ============================================================================
FROM --platform=linux/amd64 docker.io/library/node:22-alpine AS backend-builder

# Build tools required by bcrypt's native module (node-gyp → python3/make/gcc)
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

COPY backend/package.json backend/pnpm-lock.yaml ./

RUN npm install -g pnpm@10 --quiet

# onlyBuiltDependencies in the lockfile settings allows bcrypt and Prisma
# packages to run their install scripts; all others remain blocked.
RUN pnpm install --no-frozen-lockfile

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
# STAGE 3/3: Production Image  [RUNTIME ARCH: arm64]
# No platform pin — inherits linux/arm64 from `docker buildx --platform`.
# bcrypt is rebuilt here from source because stage 2 compiled it for amd64.
# ============================================================================
FROM docker.io/library/node:22-alpine

WORKDIR /app

# Build tools: needed only to recompile bcrypt's native module for arm64.
# Runtime libs (libstdc++, libgcc) are kept; build tools are removed after.
RUN apk add --no-cache python3 make g++ gcc libstdc++ libgcc

# Production node_modules from the amd64 builder (bcrypt binary is wrong arch here)
COPY --from=backend-builder /app/node_modules ./node_modules

# Recompile bcrypt's native .node binary for the runtime platform (arm64).
# All other native modules in this project are pure-JS so no other rebuilds needed.
RUN npm rebuild bcrypt && \
    apk del python3 make g++ gcc && \
    rm -rf /var/cache/apk/*

# Compiled TypeScript output
COPY --from=backend-builder /app/dist ./dist

# Prisma schema — needed for `prisma migrate deploy` at container startup
COPY --from=backend-builder /app/prisma ./prisma

# Regenerate the Prisma client natively for arm64.
# pnpm prune --prod in stage 2 wipes .prisma/client (a side effect of the prisma
# devDep), so we re-run generate here on the actual target platform. The prisma
# CLI survives prune in .pnpm/ because @prisma/client lists it as a peer dep.
RUN PRISMA_BIN=$(find /app/node_modules/.pnpm -name "index.js" -path "*/prisma/build/index.js" 2>/dev/null | head -1) && \
    [ -n "$PRISMA_BIN" ] || (echo "ERROR: prisma CLI not found in pnpm store" && exit 1) && \
    DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" node "$PRISMA_BIN" generate

COPY backend/package.json ./

# Frontend static files (served by the backend in non-Pi deployments)
COPY --from=frontend-builder /frontend/dist ./public

COPY backend/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN mkdir -p /app/uploads /app/backups /app/images && \
    chmod +x /app/docker-entrypoint.sh

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
