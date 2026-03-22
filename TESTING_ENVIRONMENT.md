# Testing Environment Guide

## Quick Start

### Start the Application
```bash
./scripts/run-local.sh
```

### Access Points
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8080/api
- **Health Check**: http://localhost:8080/health

### Test Credentials
**Regular User:**
- Email: `test@example.com`
- Password: `TestPass123!`

**Admin User:**
- Email: `testadmin@example.com`
- Password: `AdminPass123!`

## Data Persistence

All data created during testing sessions is automatically persisted:

### Database Data (PostgreSQL)
- **Volume**: `mealplanner_postgres_data`
- **Location**: Podman volume (managed by Podman)
- **Persists**: Users, recipes, meal plans, grocery lists, ingredients, etc.
- **Survives**: Container restarts, `podman-compose down`, system reboots

### Cache Data (Redis)
- **Volume**: `mealplanner_redis_data`
- **Location**: Podman volume (managed by Podman)
- **Persists**: Session data, cached queries
- **Survives**: Container restarts, `podman-compose down`, system reboots

### File Uploads
- **Location**: `./data/uploads/` (host filesystem)
- **Persists**: Recipe images, user uploads
- **Survives**: Everything (directly on your filesystem)

### Backups
- **Location**: `./data/backups/` (host filesystem)
- **Persists**: Database backups
- **Survives**: Everything (directly on your filesystem)

### Images
- **Location**: `./data/images/` (host filesystem)
- **Persists**: Cached recipe images
- **Survives**: Everything (directly on your filesystem)

## Managing Test Data

### View Current Data
```bash
# Check users
podman exec meals-postgres psql -U mealplanner -d meal_planner -c "SELECT email, family_name, role FROM users;"

# Check recipes
podman exec meals-postgres psql -U mealplanner -d meal_planner -c "SELECT id, title, user_id FROM recipes;"

# Check ingredients
podman exec meals-postgres psql -U mealplanner -d meal_planner -c "SELECT COUNT(*) FROM ingredients;"
```

### Reset Test Data (if needed)
```bash
# Stop containers
podman-compose -f podman-compose.yml down

# Remove volumes (WARNING: deletes all data)
podman volume rm mealplanner_postgres_data mealplanner_redis_data

# Restart (will create fresh volumes)
./scripts/run-local.sh

# Reload test users
podman exec -i meals-postgres psql -U mealplanner -d meal_planner < database/init/02-test-data.sql
```

### Backup Current Test Data
```bash
# Backup database
podman exec meals-postgres pg_dump -U mealplanner meal_planner > backup-$(date +%Y%m%d-%H%M%S).sql

# Backup uploaded files
tar -czf uploads-backup-$(date +%Y%m%d-%H%M%S).tar.gz data/uploads/
```

### Restore Test Data
```bash
# Restore database
podman exec -i meals-postgres psql -U mealplanner -d meal_planner < backup-YYYYMMDD-HHMMSS.sql

# Restore uploaded files
tar -xzf uploads-backup-YYYYMMDD-HHMMSS.tar.gz
```

## Common Commands

### View Logs
```bash
# All services
podman-compose -f podman-compose.yml logs -f

# Specific service
podman logs -f meals-backend
podman logs -f meals-frontend
podman logs -f meals-postgres
```

### Check Service Status
```bash
podman-compose -f podman-compose.yml ps
```

### Restart Services
```bash
# Restart all
podman-compose -f podman-compose.yml restart

# Restart specific service
podman-compose -f podman-compose.yml restart backend
```

### Stop Services (keeps data)
```bash
podman-compose -f podman-compose.yml down
```

### Database Access
```bash
# Connect to PostgreSQL
podman exec -it meals-postgres psql -U mealplanner -d meal_planner

# Run a query
podman exec meals-postgres psql -U mealplanner -d meal_planner -c "YOUR SQL HERE"
```

## Testing Workflow

1. **Start Application**: `./scripts/run-local.sh`
2. **Log In**: Use test credentials at http://localhost:8080
3. **Test Features**: Create recipes, meal plans, grocery lists, etc.
4. **Data Persists**: All changes are automatically saved
5. **Stop When Done**: `podman-compose -f podman-compose.yml down`
6. **Resume Later**: `./scripts/run-local.sh` - all your data will still be there!

## Troubleshooting

### Can't Log In
- Verify test users exist: `podman exec meals-postgres psql -U mealplanner -d meal_planner -c "SELECT email FROM users;"`
- If empty, reload test data: `podman exec -i meals-postgres psql -U mealplanner -d meal_planner < database/init/02-test-data.sql`

### Database Connection Errors
- Check backend logs: `podman logs meals-backend`
- Verify DATABASE_URL is set correctly in podman-compose.yml

### Port Already in Use
- Check what's using port 8080: `lsof -i :8080`
- Stop conflicting service or change port in podman-compose.yml

### Data Not Persisting
- Verify volumes exist: `podman volume ls | grep mealplanner`
- Check volume is mounted: `podman inspect meals-postgres | jq '.[0].Mounts'`

## Notes

- The test data SQL file has outdated recipe schema and will show errors when loading recipes
- This is fine - create recipes through the UI instead
- All data created through the UI will persist correctly
- Volumes are named with `mealplanner_` prefix to avoid conflicts

---

Made with Bob