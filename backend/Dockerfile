# Multi-stage build for Node.js backend with integrated frontend
# Optimized for ARM architecture (Raspberry Pi) with minimal size

# Stage 1: Build frontend
FROM docker.io/library/node:20-alpine AS frontend-builder

WORKDIR /frontend

# Copy frontend package files
COPY frontend/package.json frontend/pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm@10

# Install frontend dependencies (production only)
RUN pnpm install --frozen-lockfile --prod=false

# Copy frontend source code
COPY frontend ./

# Build argument for API URL
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Build the frontend application
RUN pnpm build

# Stage 2: Build backend
FROM docker.io/library/node:20-alpine AS backend-builder

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

# Copy package files
COPY backend/package.json backend/pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm@10

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY backend .

# Generate Prisma client with ARM workaround
# Use dummy DATABASE_URL for build time (will be replaced at runtime)
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Build TypeScript
RUN pnpm build

# Stage 3: Production (OPTIMIZED)
FROM docker.io/library/node:20-alpine

# Install runtime dependencies
RUN apk add --no-cache wget

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy package files
COPY backend/package.json backend/pnpm-lock.yaml ./

# Install ONLY production dependencies (excludes devDependencies like TypeScript, @types/*, etc.)
RUN pnpm install --frozen-lockfile --prod

# Copy prisma schema
COPY --from=backend-builder /app/prisma ./prisma

# Generate Prisma client in production stage
# Use dummy DATABASE_URL for build time (will be replaced at runtime)
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Clean up pnpm cache and store to save space
RUN pnpm store prune && rm -rf /root/.local/share/pnpm/store

# Copy built backend from builder
COPY --from=backend-builder /app/dist ./dist

# Copy built frontend from frontend-builder
COPY --from=frontend-builder /frontend/dist ./public

# Create directories for uploads and backups
RUN mkdir -p /app/uploads /app/backups /app/images

# Copy entrypoint script
COPY backend/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Set environment
ENV NODE_ENV=production

# Remove npm cache to save space
RUN npm cache clean --force

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start application using entrypoint script
ENTRYPOINT ["/app/docker-entrypoint.sh"]