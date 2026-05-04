# Database Environment Management

## Overview

This document explains how to manage separate development and production databases to prevent accidental data loss. **Following these guidelines is critical to protect your data.**

## The Problem

Previously, the application used a single database for both development and production, which led to:
- **Data loss** when running migrations or seeds during development
- **No separation** between test data and real user data
- **Accidental overwrites** when switching between environments

## The Solution

We now use **separate databases** for each environment:

```
Development:  mealplanner_dev   (for testing, can be reset)
Production:   mealplanner_prod  (for real data, NEVER reset)
```

## Environment Setup

### 1. Development Environment

**Purpose:** Testing, development, and experimentation. This database can be reset without consequences.

**Setup:**

```bash
# 1. Copy .env.example to .env
cp .env.example .env

# 2. Edit .env and set:
NODE_ENV=development
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/mealplanner_dev

# 3. Create the development database
createdb mealplanner_dev

# 4. Run migrations
cd backend && npx prisma migrate dev

# 5. Seed with test data (optional)
npm run prisma:seed
```

**Safe to:**
- ✅ Run migrations without backup
- ✅ Reset database
- ✅ Experiment with schema changes
- ✅ Use test data

### 2. Production Environment

**Purpose:** Real user data. This database must be protected at all costs.

**Setup:**

```bash
# 1. Create a separate .env.production file
cp .env.example .env.production

# 2. Edit .env.production and set:
NODE_ENV=production
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/mealplanner_prod

# 3. Create the production database
createdb mealplanner_prod

# 4. Run migrations using the safe migration script
./scripts/safe-migrate.sh --production

# 5. NEVER run seed scripts on production!
```

**NEVER:**
- ❌ Run migrations without backup
- ❌ Reset the database
- ❌ Run seed scripts
- ❌ Experiment with schema changes

## Database Migration Safety

### Development Migrations

For development, you can run migrations directly:

```bash
cd backend
npx prisma migrate dev
```

### Production Migrations

**ALWAYS use the safe migration script for production:**

```bash
# This script will:
# 1. Create an automatic backup
# 2. Require explicit confirmation
# 3. Run the migration
# 4. Verify the database
./scripts/safe-migrate.sh --production
```

### Manual Backup Before Migration

You can also create a manual backup:

```bash
./scripts/pre-migration-backup.sh
```

This creates a timestamped backup in `data/backups/` with restore instructions.

## Database Backup Strategy

### Automatic Backups

The `safe-migrate.sh` script automatically creates backups before migrations.

### Manual Backups

Create a backup anytime:

```bash
./scripts/pre-migration-backup.sh
```

### Backup Retention

- Keep backups for **at least 7 days** after a migration
- Keep monthly backups for **at least 6 months**
- Store critical backups off-site (external drive, cloud storage)

### Backup Location

All backups are stored in: `data/backups/`

Format: `pre_migration_YYYYMMDD_HHMMSS.sql.gz`

## Restoring from Backup

### Using the Restore Script

```bash
./scripts/restore-database.sh data/backups/pre_migration_20260504_120000.sql.gz
```

### Manual Restore

```bash
# 1. Stop the application
# 2. Restore the backup
gunzip -c data/backups/pre_migration_20260504_120000.sql.gz | \
  PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -U postgres -d mealplanner_prod
# 3. Restart the application
```

## Switching Between Environments

### Method 1: Environment Files (Recommended)

```bash
# Development
cp .env.development .env
npm run dev

# Production
cp .env.production .env
npm start
```

### Method 2: Environment Variables

```bash
# Development
NODE_ENV=development DATABASE_URL=postgresql://...mealplanner_dev npm run dev

# Production
NODE_ENV=production DATABASE_URL=postgresql://...mealplanner_prod npm start
```

## Database Naming Convention

| Environment | Database Name | Purpose |
|-------------|---------------|---------|
| Development | `mealplanner_dev` | Local development and testing |
| Staging | `mealplanner_staging` | Pre-production testing (optional) |
| Production | `mealplanner_prod` | Real user data |
| Test | `mealplanner_test` | Automated tests (optional) |

## Checklist: Before Running Migrations

### Development
- [ ] Confirm you're using `mealplanner_dev` database
- [ ] Check `NODE_ENV=development` in .env
- [ ] Run migration: `cd backend && npx prisma migrate dev`

### Production
- [ ] **STOP!** Are you sure you need to migrate production?
- [ ] Review migration files in `backend/prisma/migrations/`
- [ ] Confirm you're using `mealplanner_prod` database
- [ ] Check `NODE_ENV=production` in .env
- [ ] Run: `./scripts/safe-migrate.sh --production`
- [ ] Follow all prompts carefully
- [ ] Test the application thoroughly after migration
- [ ] Keep the backup file for at least 7 days

## Common Mistakes to Avoid

### ❌ DON'T:
1. Use the same database for development and production
2. Run `prisma migrate dev` on production
3. Run seed scripts on production database
4. Delete backups immediately after migration
5. Skip backups "just this once"
6. Ignore the environment variable warnings

### ✅ DO:
1. Use separate databases for each environment
2. Always backup before production migrations
3. Use the safe migration script for production
4. Keep backups for at least 7 days
5. Test migrations in development first
6. Document any manual database changes

## Troubleshooting

### "Database not found" Error

```bash
# Create the database
createdb mealplanner_dev  # or mealplanner_prod
```

### "Cannot connect to database" Error

1. Check PostgreSQL is running: `pg_isready`
2. Verify DATABASE_URL in .env
3. Check database exists: `psql -l | grep mealplanner`

### "Migration failed" Error

1. Check the error message carefully
2. Restore from backup if needed
3. Fix the issue in development first
4. Test the migration in development
5. Then retry in production

### Accidentally Ran Migration on Wrong Database

1. **IMMEDIATELY** stop the application
2. Restore from the most recent backup
3. Verify the restore was successful
4. Review your environment configuration
5. Run the migration on the correct database

## Emergency Contacts

If you experience data loss:
1. **DO NOT** run any more commands
2. **DO NOT** restart the database
3. Check `data/backups/` for recent backups
4. Follow the restore procedure above
5. Document what happened to prevent recurrence

## Additional Resources

- [Prisma Migration Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [Database Backup Best Practices](../docs/DATABASE_BACKUP.md)

---

**Remember:** Your production database contains real user data. Treat it with care!