# Deploying Meal Planner at /mealplanner Subdirectory

This guide explains how to deploy the meal planner application at `http://pihole/mealplanner` instead of the root path.

## Overview

To deploy at a subdirectory, you need to:
1. Configure Vite to build with a base path
2. Update nginx configuration to handle the subdirectory
3. Update React Router to use the base path
4. Adjust API URLs and CORS settings
5. Update build scripts

## Required Changes

### 1. Update Vite Configuration

Add base path support to `frontend/vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',  // Add this line
  // ... rest of config
})
```

### 2. Update React Router

Modify `frontend/src/main.tsx` to use basename:

```typescript
import { BrowserRouter } from 'react-router-dom'

const basename = import.meta.env.VITE_BASE_PATH || '/'

root.render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
```

### 3. Create Subdirectory Nginx Configuration

Create `nginx/subdirectory.conf`:

```nginx
upstream backend {
    server backend:3000;
}

upstream frontend {
    server frontend:80;
}

server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    server_tokens off;

    # Health check at root
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Meal planner application at /mealplanner
    location /mealplanner {
        # Remove /mealplanner prefix when proxying to frontend
        rewrite ^/mealplanner(/.*)$ $1 break;
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Prefix /mealplanner;
        proxy_cache_bypass $http_upgrade;
    }

    # API routes at /mealplanner/api
    location /mealplanner/api/ {
        # Remove /mealplanner prefix, keep /api
        rewrite ^/mealplanner(/api/.*)$ $1 break;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # Static images at /mealplanner/images
    location /mealplanner/images/ {
        alias /usr/share/nginx/html/images/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
}
```

### 4. Update Frontend Dockerfile

Modify `frontend/Dockerfile` to accept base path:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build argument for base path
ARG VITE_BASE_PATH=/
ARG VITE_API_URL=/api

ENV VITE_BASE_PATH=$VITE_BASE_PATH
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 5. Update podman-compose.yml

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_BASE_PATH: /mealplanner  # Add this
        VITE_API_URL: /mealplanner/api  # Update this
    # ... rest of config

  nginx:
    volumes:
      - ./nginx/subdirectory.conf:/etc/nginx/conf.d/default.conf:ro  # Use subdirectory config
      - ./data/images:/usr/share/nginx/html/images:ro
```

### 6. Update CORS Configuration

In `backend`, update CORS origins to include subdirectory:

```typescript
// backend/src/index.ts or wherever CORS is configured
const corsOptions = {
  origin: [
    'http://localhost:8080',
    'http://pihole',
    'http://pihole/mealplanner',
    'http://raspberrypi.local:8080',
    // ... other origins
  ],
  credentials: true
}
```

## Deployment Steps

### Option 1: Build with Subdirectory Support

```bash
# 1. Build images with subdirectory configuration
VITE_BASE_PATH=/mealplanner podman-compose build

# 2. Start services
podman-compose up -d

# 3. Access at http://pihole/mealplanner
```

### Option 2: Use Separate Compose File

Create `podman-compose.subdirectory.yml`:

```yaml
version: '3.8'

# Extends main compose file
services:
  frontend:
    build:
      args:
        VITE_BASE_PATH: /mealplanner
        VITE_API_URL: /mealplanner/api

  nginx:
    volumes:
      - ./nginx/subdirectory.conf:/etc/nginx/conf.d/default.conf:ro
      - ./data/images:/usr/share/nginx/html/images:ro
```

Deploy with:
```bash
podman-compose -f podman-compose.yml -f podman-compose.subdirectory.yml up -d
```

## Testing

```bash
# Test health endpoint
curl http://pihole/health

# Test application
curl http://pihole/mealplanner

# Test API
curl http://pihole/mealplanner/api/health
```

## Troubleshooting

### Assets Not Loading

If CSS/JS files return 404:
- Check browser console for actual URLs being requested
- Verify `base` in vite.config.ts matches nginx location
- Ensure frontend build includes VITE_BASE_PATH

### API Calls Failing

If API calls return 404:
- Check Network tab in browser dev tools
- Verify API_URL environment variable: `/mealplanner/api`
- Check nginx rewrite rules are correct

### Routing Issues

If React Router navigation doesn't work:
- Verify `basename` prop in BrowserRouter
- Check that it matches VITE_BASE_PATH
- Ensure nginx passes all routes to frontend

## Reverting to Root Path

To deploy at root path again:

```bash
# Remove VITE_BASE_PATH or set to /
VITE_BASE_PATH=/ podman-compose build

# Use default nginx config
# In podman-compose.yml, use ./nginx/default.conf
```

## Integration with Pi-hole

Since Pi-hole typically runs at root (`/`), deploying meal planner at `/mealplanner` avoids conflicts:

- Pi-hole admin: `http://pihole/admin`
- Meal Planner: `http://pihole/mealplanner`

Both can coexist on the same Pi without port conflicts.