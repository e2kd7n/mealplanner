# Port Standardization Guide

**Version:** 1.0.0  
**Last Updated:** 2026-04-22

## Overview

This document defines the standardized port configuration for the Meal Planner application across all deployment modes (local development, containerized development, and production).

## Standard Port Assignments

### Core Application Ports

| Service | Port | Protocol | Usage |
|---------|------|----------|-------|
| **Frontend (Dev)** | 5173 | HTTP | Vite development server |
| **Backend API** | 3000 | HTTP | Express.js API server |
| **Nginx Proxy** | 8080 | HTTP | Production reverse proxy |
| **PostgreSQL** | 5432 | TCP | Database server |
| **Redis** | 6379 | TCP | Cache/session store |
| **HTTPS (Optional)** | 443 | HTTPS | Secure connections |

### Port Usage by Deployment Mode

#### Local Development (npm/pnpm dev)
```
Frontend:  http://localhost:5173  (Vite dev server)
Backend:   http://localhost:3000  (Express direct)
Database:  localhost:5432          (PostgreSQL)
Redis:     localhost:6379          (Redis)
```

#### Container Development (podman-compose)
```
Frontend:  http://localhost:8080  (via nginx proxy)
Backend:   http://localhost:8080/api (via nginx proxy)
Database:  localhost:5432          (exposed from container)
Redis:     localhost:6379          (exposed from container)
```

#### Production Deployment
```
Application: http://hostname:8080 or https://hostname:443
API:         http://hostname:8080/api
Database:    Internal only (postgres:5432)
Redis:       Internal only (redis:6379)
```

## Hostname Strategy

### Local Development
- Use `localhost` for all services
- Frontend connects directly to backend at `http://localhost:3000/api`

### Container Deployment
- Use `localhost` or `raspberrypi.local` for external access
- Internal services use Docker/Podman service names:
  - `backend:3000` (nginx → backend)
  - `postgres:5432` (backend → database)
  - `redis:6379` (backend → cache)

### Production
- Use actual hostname or IP address
- Configure CORS_ORIGIN with production URLs
- Use nginx as reverse proxy on port 8080 (HTTP) or 443 (HTTPS)

## Configuration Files

### Frontend Configuration

**File:** `frontend/.env`
```env
# Local development - direct backend connection
VITE_API_URL=http://localhost:3000/api

# Container deployment - via nginx proxy
# VITE_API_URL=/api
```

**File:** `frontend/vite.config.ts`
```typescript
server: {
  port: 5173,
  strictPort: false,
}
```

### Backend Configuration

**File:** `backend/.env`
```env
PORT=3000
HTTPS_PORT=443
HOST=0.0.0.0

# Local development CORS
CORS_ORIGIN=http://localhost:5173

# Container deployment CORS
# CORS_ORIGIN=http://localhost:8080,http://raspberrypi.local:8080
```

**File:** `backend/src/index.ts`
```typescript
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;
```

### Container Configuration

**File:** `podman-compose.yml`
```yaml
backend:
  environment:
    PORT: 3000
    POSTGRES_PORT: 5432
  
nginx:
  ports:
    - "8080:80"  # HTTP
    - "8443:443" # HTTPS (optional)
```

**File:** `nginx/default.conf`
```nginx
upstream backend {
    server backend:3000;
}
```

## Port Conflict Resolution

### Check for Port Usage
```bash
# Check if port is in use
lsof -i :5173  # Frontend
lsof -i :3000  # Backend
lsof -i :8080  # Nginx
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Kill process using port
lsof -ti:3000 | xargs kill -9
```

### Change Ports (If Needed)

**Frontend:**
```bash
# Edit frontend/vite.config.ts
server: {
  port: 5174,  # Use different port
}
```

**Backend:**
```bash
# Edit backend/.env
PORT=3001  # Use different port
```

**Nginx:**
```bash
# Edit podman-compose.yml
nginx:
  ports:
    - "8081:80"  # Use different external port
```

## Testing Port Configuration

### Local Development
```bash
# Start services
cd backend && pnpm dev  # Should start on port 3000
cd frontend && pnpm dev # Should start on port 5173

# Test connectivity
curl http://localhost:3000/health
curl http://localhost:5173
```

### Container Deployment
```bash
# Start containers
podman-compose up -d

# Test connectivity
curl http://localhost:8080
curl http://localhost:8080/api/health
curl http://localhost:8080/health
```

## Common Issues and Solutions

### Issue: Port Already in Use
**Solution:** Check what's using the port and stop it, or change the port in configuration.

### Issue: Frontend Can't Connect to Backend
**Solution:** Verify VITE_API_URL matches backend port:
- Local dev: `http://localhost:3000/api`
- Container: `/api` (relative, via nginx)

### Issue: CORS Errors
**Solution:** Ensure CORS_ORIGIN includes the frontend URL:
- Local dev: `http://localhost:5173`
- Container: `http://localhost:8080`

### Issue: Database Connection Failed
**Solution:** Verify DATABASE_URL uses correct port:
- Local: `localhost:5432`
- Container: `postgres:5432`

## Migration Checklist

When changing ports, update these files:

- [ ] `frontend/.env` - VITE_API_URL
- [ ] `frontend/vite.config.ts` - server.port
- [ ] `backend/.env` - PORT, CORS_ORIGIN
- [ ] `backend/.env.example` - PORT, CORS_ORIGIN
- [ ] `podman-compose.yml` - ports mapping
- [ ] `nginx/default.conf` - upstream backend
- [ ] Documentation files (README.md, SETUP.md, etc.)
- [ ] Test scripts and CI/CD configurations

## Best Practices

1. **Use Standard Ports:** Stick to the defined ports unless there's a conflict
2. **Document Changes:** Update this file if ports are changed
3. **Environment Variables:** Use .env files, never hardcode ports
4. **CORS Configuration:** Always update CORS_ORIGIN when changing frontend port
5. **Health Checks:** Verify all services are accessible after port changes
6. **Firewall Rules:** Update firewall rules if changing exposed ports

## References

- [Vite Server Options](https://vitejs.dev/config/server-options.html)
- [Express.js Port Configuration](https://expressjs.com/en/starter/hello-world.html)
- [Nginx Upstream Configuration](https://nginx.org/en/docs/http/ngx_http_upstream_module.html)
- [Docker Port Mapping](https://docs.docker.com/config/containers/container-networking/)