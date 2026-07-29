# Multi-stage build for React frontend
# Optimized for ARM architecture (Raspberry Pi) with minimal size

# Builder always runs on amd64 — Vite/pnpm output is arch-agnostic JS/CSS/HTML.
# Running the build under QEMU arm64 emulation takes 60-120min; this cuts it to ~2min.
FROM --platform=linux/amd64 docker.io/library/node:22-alpine AS builder

WORKDIR /app

# Copy package files. pnpm-workspace.yaml must come along — it carries the
# allowBuilds allow-list (pnpm 10+ requires explicit build-script approval,
# and rejects it as a hard error with no TTY to prompt in). Without this file
# in the build context, `pnpm install` fails with ERR_PNPM_IGNORED_BUILDS
# even though esbuild is allow-listed in package.json (see #290).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Version pinned to match packageManager in package.json — a floating major
# tag (pnpm@10) can silently re-resolve to a newer patch release with
# different build-script enforcement behavior (see #290).
RUN npm install -g pnpm@11.1.2 --quiet

# Install dependencies (build only, no dev dependencies needed in final image)
RUN pnpm install --no-frozen-lockfile --prod=false

# Copy source code
COPY . .

# Build argument for API URL
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL

# Force Vite to use Rollup instead of Rolldown (Rolldown doesn't support ARM)
ENV VITE_USE_ROLLUP=true

# Build the application
RUN pnpm build

# Clean up node_modules after build to reduce layer size
RUN rm -rf node_modules

# Production stage with nginx (OPTIMIZED)
FROM docker.io/library/nginx:alpine

# Remove default nginx static assets and config
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy built assets from builder (only dist folder, not node_modules)
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove unnecessary nginx modules and files to save space
RUN rm -rf /usr/share/nginx/html/*.map 2>/dev/null || true

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]