# Database Backup and Restore Guide

## Overview

The Meal Planner application includes automated database backup and restore scripts to protect against data loss.

## Backup System

### Manual Backup

To create a backup manually:

```bash
./scripts/backup-database.sh
```

This will:
- Create a compressed SQL dump in `./data/backups/`
- Name it with timestamp: `mealplanner_backup_YYYYMMDD_HHMMSS.sql.gz`
- Keep the last 7 backups (configurable)
- Display backup size and status

### Automated Backups

#### Option 1: Cron Job (Recommended for Development)

Add to your crontab (`crontab -e`):

```bash
# Daily backup at 2 AM
0 2 * * * cd /Users/erik/dev/mealplanner && ./scripts/backup-database.sh >> ./data/backups/backup.log 2>&1

# Or every 6 hours for more frequent backups
0 */6 * * * cd /Users/erik/dev/mealplanner && ./scripts/backup-database.sh >> ./data/backups/backup.log 2>&1
```

#### Option 2: launchd (macOS Alternative)

Create `~/Library/LaunchAgents/com.mealplanner.backup.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.mealplanner.backup</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/erik/dev/mealplanner/scripts/backup-database.sh</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/erik/dev/mealplanner</string>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>2</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/Users/erik/dev/mealplanner/data/backups/backup.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/erik/dev/mealplanner/data/backups/backup.log</string>
</dict>
</plist>
```

Load it:
```bash
launchctl load ~/Library/LaunchAgents/com.mealplanner.backup.plist
```

## Restore System

### List Available Backups

```bash
ls -lh ./data/backups/mealplanner_backup_*.sql.gz
```

### Restore from Backup

```bash
./scripts/restore-database.sh ./data/backups/mealplanner_backup_20260322_163000.sql.gz
```

**Warning**: This will replace the current database with the backup. You will be prompted to confirm.

## Backup Configuration

Edit `scripts/backup-database.sh` to customize:

- `KEEP_BACKUPS=7` - Number of backups to retain (default: 7)
- `BACKUP_DIR` - Location for backups (default: `./data/backups`)

## Best Practices

1. **Before Major Changes**: Always create a manual backup before:
   - Database migrations
   - Major code changes
   - Testing destructive operations

2. **Regular Schedule**: Set up automated backups to run:
   - Daily for development
   - Hourly for production

3. **Verify Backups**: Periodically test restore process to ensure backups are valid

4. **Off-site Storage**: For production, copy backups to external storage:
   ```bash
   # Example: Copy to external drive
   cp ./data/backups/mealplanner_backup_*.sql.gz /Volumes/Backup/mealplanner/
   ```

## Troubleshooting

### Backup Fails

- Ensure PostgreSQL container is running: `podman ps | grep meals-postgres`
- Check container logs: `podman logs meals-postgres`
- Verify database name and user in script match your configuration

### Restore Fails

- Ensure backup file exists and is not corrupted
- Check that database container is running
- Verify you have write permissions to the database

## Quick Reference

```bash
# Create backup
./scripts/backup-database.sh

# List backups
ls -lh ./data/backups/

# Restore backup
./scripts/restore-database.sh ./data/backups/mealplanner_backup_YYYYMMDD_HHMMSS.sql.gz

# View backup log
tail -f ./data/backups/backup.log
```

## Important Notes

- **Never use `podman-compose down`** during development - it deletes the database volume
- Always use `podman-compose build && podman-compose up -d` to preserve data
- Backups are compressed with gzip to save space
- Old backups are automatically cleaned up based on `KEEP_BACKUPS` setting