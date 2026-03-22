# Local Development Guide

Run and test the Meal Planner application on your local machine using Podman.

## 🚀 Quick Start

### One Command Setup

```bash
# Make script executable (first time only)
chmod +x scripts/run-local.sh

# Build and run locally
./scripts/run-local.sh
```

This will:
1. ✅ Check prerequisites (Podman, podman-compose)
2. 🔐 Generate secrets if needed
3. 🔨 Build images for your native architecture
4. 🚀 Start all services (PostgreSQL, Redis, Backend, Frontend, Nginx)
5. 🔄 Run database migrations
6. 📊 Display service status

### Access Your Application

Once running, access at:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## 📋 Prerequisites

### Install Podman

**macOS:**
```bash
brew install podman
podman machine init
podman machine start
```

**Linux:**
```bash
sudo apt-get install podman
```

**Windows (WSL2):**
```bash
sudo apt-get install podman
```

### Install podman-compose

```bash
pip3 install podman-compose
```

## 🔧 Manual Setup (Alternative)

If you prefer manual control:

### 1. Generate Secrets

```bash
./scripts/generate-secrets.sh
```

### 2. Build Images

```bash
# Build backend
podman build -t meals-backend:latest -f backend/Dockerfile backend/

# Build frontend
podman build -t meals-frontend:latest \
  --build-arg VITE_API_URL=http://localhost:3000/api \
  -f frontend/Dockerfile frontend/
```

### 3. Start Services

```bash
podman-compose -f podman-compose.yml up -d
```

### 4. Run Migrations

```bash
# Wait for services to be ready (about 15 seconds)
sleep 15

# Run migrations
podman exec meals-backend sh -c "cd /app && npx prisma migrate deploy"
```

## 📝 Common Commands

### View Logs

```bash
# All services
podman-compose -f podman-compose.yml logs -f

# Specific service
podman-compose -f podman-compose.yml logs -f backend
podman-compose -f podman-compose.yml logs -f frontend
podman-compose -f podman-compose.yml logs -f postgres
```

### Check Status

```bash
podman-compose -f podman-compose.yml ps
```

### Stop Services

```bash
podman-compose -f podman-compose.yml down
```

### Restart Services

```bash
# Restart all
podman-compose -f podman-compose.yml restart

# Restart specific service
podman-compose -f podman-compose.yml restart backend
```

### Rebuild After Code Changes

```bash
# Stop services
podman-compose -f podman-compose.yml down

# Rebuild and restart
./scripts/run-local.sh
```

### Access Database

```bash
# Connect to PostgreSQL
podman exec -it meals-postgres psql -U mealplanner -d meal_planner

# Run SQL queries
\dt  # List tables
SELECT * FROM "User";
\q   # Quit
```

### Access Redis

```bash
# Connect to Redis
podman exec -it meals-redis redis-cli

# Authenticate (password in secrets/redis_password.txt)
AUTH your_redis_password

# Check keys
KEYS *
```

## 🐛 Debugging

### View Container Logs

```bash
# Backend logs
podman logs meals-backend

# Frontend logs
podman logs meals-frontend

# Database logs
podman logs meals-postgres

# Follow logs in real-time
podman logs -f meals-backend
```

### Inspect Containers

```bash
# List running containers
podman ps

# Inspect container details
podman inspect meals-backend

# Check container resource usage
podman stats
```

### Execute Commands in Containers

```bash
# Backend shell
podman exec -it meals-backend sh

# Check backend environment
podman exec meals-backend env

# Run Prisma commands
podman exec meals-backend npx prisma studio
```

### Check Health

```bash
# Backend health
curl http://localhost:3000/health

# Frontend (via nginx)
curl http://localhost:8080

# Database connection
podman exec meals-postgres pg_isready -U mealplanner
```

## 🔄 Development Workflow

### 1. Make Code Changes

Edit files in `backend/` or `frontend/` directories.

### 2. Rebuild and Test

```bash
# Stop current containers
podman-compose -f podman-compose.yml down

# Rebuild and restart
./scripts/run-local.sh
```

### 3. View Changes

Open http://localhost:8080 in your browser.

## 🎯 Hot Reload Development (Optional)

For faster development with hot reload:

### Backend Hot Reload

```bash
# Stop the containerized backend
podman-compose -f podman-compose.yml stop backend

# Run backend locally with nodemon
cd backend
pnpm install
pnpm dev
```

### Frontend Hot Reload

```bash
# Stop the containerized frontend
podman-compose -f podman-compose.yml stop frontend nginx

# Run frontend locally with Vite
cd frontend
pnpm install
pnpm dev
```

Access at:
- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:3000

## 🧪 Testing

### Run Backend Tests

```bash
# Inside backend container
podman exec meals-backend pnpm test

# Or locally
cd backend
pnpm test
```

### Database Migrations

```bash
# Create new migration
podman exec meals-backend npx prisma migrate dev --name your_migration_name

# Apply migrations
podman exec meals-backend npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
podman exec meals-backend npx prisma migrate reset
```

### Seed Database

```bash
# Run seed script (if you have one)
podman exec meals-backend npx prisma db seed
```

## 🔍 Troubleshooting

### Port Already in Use

If port 8080 is already in use:

```bash
# Edit podman-compose.yml
# Change nginx ports from "8080:80" to "8081:80"

# Or stop the conflicting service
lsof -ti:8080 | xargs kill -9
```

### Images Not Building

```bash
# Clean up old images
podman system prune -a

# Rebuild from scratch
podman-compose -f podman-compose.yml build --no-cache
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
podman ps | grep postgres

# Check PostgreSQL logs
podman logs meals-postgres

# Verify connection
podman exec meals-postgres pg_isready -U mealplanner
```

### Podman Machine Issues (macOS)

```bash
# Check machine status
podman machine list

# Restart machine
podman machine stop
podman machine start

# Reset machine (last resort)
podman machine rm
podman machine init
podman machine start
```

## 📊 Performance Tips

1. **Allocate more resources to Podman machine** (macOS):
   ```bash
   podman machine stop
   podman machine rm
   podman machine init --cpus 4 --memory 8192 --disk-size 50
   podman machine start
   ```

2. **Use volume mounts for development**:
   - Edit `podman-compose.yml` to add volume mounts for hot reload

3. **Clean up regularly**:
   ```bash
   # Remove unused images
   podman image prune -a
   
   # Remove unused volumes
   podman volume prune
   
   # Full cleanup
   podman system prune -a --volumes
   ```

## 🎨 Podman Desktop

View and manage containers visually:

1. Open **Podman Desktop** application
2. Navigate to **Containers** to see running services
3. Navigate to **Images** to see built images
4. Click on containers to view logs, stats, and terminal access

## 📚 Additional Resources

- [Podman Documentation](https://docs.podman.io/)
- [Podman Compose Documentation](https://github.com/containers/podman-compose)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vite Documentation](https://vitejs.dev/)

## 🆘 Need Help?

1. Check logs: `podman-compose logs -f`
2. Check status: `podman-compose ps`
3. Check health: `curl http://localhost:3000/health`
4. Review this guide's troubleshooting section
5. Check `PODMAN_DESKTOP_TROUBLESHOOTING.md` for Podman Desktop issues

---

Made with Bob