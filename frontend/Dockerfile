# Multi-stage build for React frontend
# Optimized for ARM architecture (Raspberry Pi) with minimal size

FROM docker.io/library/node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm using npm (more reliable for ARM, no network fetch needed)
RUN npm install -g pnpm@9

# Install dependencies (build only, no dev dependencies needed in final image)
RUN pnpm install --frozen-lockfile --prod=false

# Copy source code
COPY . .

# Build argument for API URL
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL

# Force Vite to use esbuild instead of rolldown for ARM compatibility
ENV VITE_USE_ESBUILD=true

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