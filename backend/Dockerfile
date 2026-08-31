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
# pnpm@10+ blocks build scripts by default. allowBuilds in pnpm-workspace.yaml
# explicitly approves the packages that need native compilation or postinstall
# hooks (Prisma). This setting is read by every pnpm invocation including
# subprocess calls from prisma generate — but only if pnpm-workspace.yaml is
# actually present in the build context (see the COPY steps below, #290).

# ============================================================================
# STAGE 1/3: Frontend Builder  [BUILD ARCH: amd64]
# Pinned to amd64: Rolldown does not support ARM; Rollup's ARM binary is
# unreliable under QEMU. JS/CSS output is platform-independent.
# ============================================================================
FROM --platform=linux/amd64 docker.io/library/node:22-alpine AS frontend-builder

WORKDIR /frontend

# pnpm-workspace.yaml carries the allowBuilds allow-list (pnpm 10+ requires
# explicit build-script approval and treats a missing approval as a hard
# error with no TTY to prompt in); omitting it from the build context fails
# `pnpm install` with ERR_PNPM_IGNORED_BUILDS even though esbuild is
# allow-listed in package.json (see #290).
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./

# Version pinned to match packageManager in frontend/package.json — a
# floating major tag (pnpm@10) can silently re-resolve to a newer patch
# release with different build-script enforcement behavior (see #290).
RUN npm install -g pnpm@11.1.2 --quiet

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

# pnpm-workspace.yaml carries the allowBuilds allow-list (pnpm 10+ requires
# explicit build-script approval and treats a missing approval as a hard
# error with no TTY to prompt in); omitting it from the build context fails
# `pnpm install` with ERR_PNPM_IGNORED_BUILDS even though Prisma is
# allow-listed in package.json (see #290).
COPY backend/package.json backend/pnpm-lock.yaml backend/pnpm-workspace.yaml ./

# Version pinned to match packageManager in backend/package.json — a
# floating major tag (pnpm@10) can silently re-resolve to a newer patch
# release with different build-script enforcement behavior (see #290).
RUN npm install -g pnpm@11.1.2 --quiet

# package.json's postinstall runs `prisma generate`, which needs the schema
# and config present *before* `pnpm install` executes it — copy them ahead
# of the install step or postinstall fails with "schema.prisma: file not
# found" even though both files exist later in the build context.
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./prisma.config.ts

RUN pnpm install --no-frozen-lockfile

COPY backend .

# PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 lets Prisma run on ARM where
# pre-built engine binaries may not match the checksum exactly.
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Generate Prisma client, compile TypeScript, strip devDeps.
# --ignore-scripts on prune: pruning removes the `prisma` devDependency
# itself, and pnpm re-fires the root package.json's postinstall
# (`prisma generate`) as part of that lifecycle — failing with "prisma:
# not found" since the binary was just pruned. The client is already
# generated above, so lifecycle scripts aren't needed here.
RUN pnpm prisma generate && \
    pnpm build && \
    pnpm prune --prod --ignore-scripts && \
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

# Prisma 7 reads the datasource URL and migration adapter exclusively from
# this config file (no more `env("DATABASE_URL")` in schema.prisma for CLI
# commands) — without it, `prisma migrate deploy` fails at container startup
# with "the datasource.url property is required", crash-looping the container.
COPY --from=backend-builder /app/prisma.config.ts ./prisma.config.ts

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
