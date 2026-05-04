# Production Database Setup Guide

## Quick Start: Setting Up Your Production Database

Follow these steps to set up a separate production database and protect your data from future loss.

### Step 1: Create Production Database

```bash
# Create a new database for production use
createdb mealplanner_prod
```

### Step 2: Configure Environment

```bash
# Create a production environment file
cp .env.example .env.production

# Edit .env.production and set:
# - NODE_ENV=production
# - DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/mealplanner_prod
```

### Step 3: Set Up Your Current Database as Development

```bash
# Rename your current database to development
# (This preserves any existing data as development data)

# 1. Check your current database name
psql -l | grep mealplanner

# 2. If it's called 'mealplanner', rename it:
psql -c "ALTER DATABASE mealplanner RENAME TO mealplanner_dev;"

# 3. Update your .env file:
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/mealplanner_dev
# NODE_ENV=development
```

### Step 4: Initialize Production Database

```bash
# Run migrations on the new production database
# (Make sure .env.production is configured first)

# Copy production env to .env temporarily
cp .env.production .env

# Run safe migration
./scripts/safe-migrate.sh --production

# Restore development env
cp .env.development .env  # or recreate your dev .env
```

### Step 5: Create Your Production User Account

```bash
# Start the application with production database
cp .env.production .env
npm run dev  # or npm start

# Then register your account at http://localhost:5173/register
# Use: edidriksen@gmail.com
```

### Step 6: Switch Back to Development

```bash
# For daily development, use the development database
cp .env.development .env
npm run dev
```

## Environment File Templates

### .env.development
```bash
NODE_ENV=development
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/mealplanner_dev
POSTGRES_PASSWORD=YOUR_PASSWORD
JWT_SECRET=dev_secret_key_change_in_production
JWT_REFRESH_SECRET=dev_refresh_secret_change_in_production
```

### .env.production
```bash
NODE_ENV=production
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/mealplanner_prod
POSTGRES_PASSWORD=YOUR_PASSWORD
JWT_SECRET=<GENERATE_SECURE_SECRET>
JWT_REFRESH_SECRET=<GENERATE_SECURE_SECRET>
```

## Daily Workflow

### Development Work
```bash
# Use development database
cp .env.development .env
npm run dev

# Run migrations (no backup needed for dev)
cd backend && npm run prisma:migrate
```

### Production Updates
```bash
# Use production database
cp .env.production .env

# ALWAYS use safe migration for production
cd backend && npm run prisma:migrate:prod

# Or manually:
./scripts/safe-migrate.sh --production
```

## Backup Commands

### Manual Backup
```bash
# Create a backup anytime
./scripts/pre-migration-backup.sh

# Or from backend directory:
npm run prisma:backup
```

### Restore from Backup
```bash
# Find your backup
ls -lh data/backups/

# Restore it
./scripts/restore-database.sh data/backups/pre_migration_YYYYMMDD_HHMMSS.sql.gz
```

## Verification Checklist

After setup, verify everything is working:

- [ ] Development database exists: `psql -l | grep mealplanner_dev`
- [ ] Production database exists: `psql -l | grep mealplanner_prod`
- [ ] .env.development file exists and points to dev database
- [ ] .env.production file exists and points to prod database
- [ ] Can connect to dev database: `psql mealplanner_dev`
- [ ] Can connect to prod database: `psql mealplanner_prod`
- [ ] Backup scripts are executable: `ls -l scripts/*.sh`
- [ ] Can create backup: `./scripts/pre-migration-backup.sh`

## Troubleshooting

### "Database does not exist"
```bash
# Create the missing database
createdb mealplanner_dev
# or
createdb mealplanner_prod
```

### "Permission denied" on scripts
```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
pg_isready

# Check your DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

## Important Reminders

1. **NEVER** run `prisma migrate dev` on production
2. **ALWAYS** use `./scripts/safe-migrate.sh --production` for production migrations
3. **KEEP** backups for at least 7 days after migrations
4. **TEST** migrations in development first
5. **VERIFY** which database you're connected to before running commands

## Next Steps

1. Read the full documentation: [DATABASE_ENVIRONMENT_MANAGEMENT.md](./DATABASE_ENVIRONMENT_MANAGEMENT.md)
2. Set up automated daily backups (optional)
3. Configure off-site backup storage (recommended)
4. Document your specific database credentials securely

---

**Need Help?** Refer to [DATABASE_ENVIRONMENT_MANAGEMENT.md](./DATABASE_ENVIRONMENT_MANAGEMENT.md) for detailed information.