/** Copyright (c) 2026 e2kd7n. All rights reserved. */

# Notification System Documentation

## Overview

The Meal Planner notification system uses [ntfy.sh](https://ntfy.sh) to send push notifications for maintenance alerts, system health monitoring, and operational events. This enables proactive monitoring and reduces the risk of service degradation or data loss.

## Features

- **Priority-based notifications**: urgent, high, default, low, min
- **Rate limiting**: Prevents notification spam
- **Retry logic**: Exponential backoff for failed deliveries
- **Quiet hours**: Suppress non-urgent notifications during specified hours
- **Notification history**: Audit trail of all sent notifications
- **Rich formatting**: Support for tags, actions, and attachments
- **Multiple channels**: ntfy.sh, email fallback (configurable)

## Architecture

```
┌─────────────────────┐
│ Health Monitor      │
│  - Disk Usage       │
│  - Memory Usage     │
│  - Error Rate       │
│  - Database Health  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Notification Service│
│  - Rate Limiting    │
│  - Retry Logic      │
│  - Quiet Hours      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐      ┌──────────────┐
│     ntfy.sh         ├─────►│ Admin Device │
│  (Push Service)     │ Push │ (Mobile/Web) │
└─────────────────────┘      └──────────────┘
```

## Setup

### 1. Basic Setup (Public Topic)

The simplest setup uses a public ntfy.sh topic:

```bash
# In .env or environment
NTFY_ENABLED=true
NTFY_SERVER_URL=https://ntfy.sh
NTFY_TOPIC=mealplanner-alerts-YOUR_UNIQUE_ID
```

**Important**: Use a unique topic ID to prevent others from receiving your notifications.

### 2. Private Topic Setup (Recommended)

For production, use a private topic with authentication:

1. Create an account at [ntfy.sh](https://ntfy.sh/account)
2. Create a new topic and set it to private
3. Generate an access token
4. Configure the token:

```bash
# Option 1: Environment variable
NTFY_AUTH_TOKEN=tk_xxxxxxxxxxxxx

# Option 2: Docker secret (recommended)
echo "tk_xxxxxxxxxxxxx" > secrets/ntfy_auth_token.txt
```

### 3. Self-Hosted ntfy.sh (Advanced)

For maximum privacy, host your own ntfy.sh server:

```bash
# Use your own server URL
NTFY_SERVER_URL=https://ntfy.yourdomain.com
NTFY_TOPIC=mealplanner-alerts
NTFY_AUTH_TOKEN=your_token
```

See [ntfy.sh self-hosting docs](https://docs.ntfy.sh/install/) for setup instructions.

### 4. Subscribe to Notifications

**Mobile App** (iOS/Android):
1. Install ntfy app from App Store or Google Play
2. Subscribe to your topic: `ntfy.sh/mealplanner-alerts-YOUR_ID`
3. If using auth token, add it in subscription settings

**Web Browser**:
1. Visit `https://ntfy.sh/mealplanner-alerts-YOUR_ID`
2. Click "Subscribe" and allow notifications

**Email Fallback**:
```bash
# Add email to receive notifications via email
NTFY_EMAIL=admin@example.com
```

## Configuration

### Environment Variables

```bash
# Enable/disable notifications
NTFY_ENABLED=true

# Server URL (default: https://ntfy.sh)
NTFY_SERVER_URL=https://ntfy.sh

# Topic name (must be unique)
NTFY_TOPIC=mealplanner-alerts-abc123

# Auth token for private topics (optional)
NTFY_AUTH_TOKEN=tk_xxxxxxxxxxxxx

# Quiet hours (optional, JSON format)
NTFY_QUIET_HOURS={"start":"22:00","end":"08:00"}

# Health check interval (milliseconds, default: 300000 = 5 minutes)
HEALTH_CHECK_INTERVAL=300000
```

### Notification Thresholds

Configure alert thresholds in the NotificationService:

```typescript
// Default thresholds (can be updated via updateConfig())
{
  diskWarningPercent: 75,      // Warn at 75% disk usage
  diskCriticalPercent: 90,     // Critical at 90% disk usage
  errorRateWarning: 5,         // Warn at 5% error rate
  errorRateCritical: 10,       // Critical at 10% error rate
  backupMaxAge: 7,             // Warn if backup older than 7 days
  maxNotificationsPerHour: 10  // Rate limit
}
```

## Notification Types

### Critical Alerts (Urgent Priority)

Sent immediately, bypass quiet hours:

- **Database backup failures**: Backup script failed
- **Disk space critical** (>90%): Risk of application failure
- **Database connection failures**: Service degradation
- **High error rates** (>10%): Application instability
- **Memory usage critical** (>90%): Risk of OOM crashes

### Warning Alerts (High Priority)

Sent during active hours:

- **Weekly maintenance due**: Reminder to run maintenance checklist
- **Disk space warning** (>75%): Cleanup recommended
- **Backup age warning**: No backup in 7+ days
- **Dependency security updates**: Critical CVEs detected
- **Elevated error rates** (>5%): Investigate issues
- **Database backup retention**: Old backups need cleanup

### Informational Alerts (Default Priority)

General notifications:

- **Maintenance completed**: Weekly checklist finished
- **Backup successful**: Confirmation of successful backup
- **System health report**: Weekly summary of metrics
- **Deployment notifications**: New version deployed

## Usage Examples

### Programmatic Usage

```typescript
import { notificationService } from './services/notification.service';

// Send critical alert
await notificationService.sendCritical(
  'Database Backup Failed',
  'Backup script exited with error code 1. Check logs immediately.',
  ['floppy_disk', 'x']
);

// Send warning
await notificationService.sendWarning(
  'Disk Space Low',
  'Disk usage at 78%. Schedule cleanup soon.',
  ['floppy_disk', 'warning']
);

// Send info
await notificationService.sendInfo(
  'Maintenance Complete',
  'Weekly maintenance checklist completed successfully.',
  ['white_check_mark', 'clipboard']
);

// Custom notification with actions
await notificationService.send({
  title: 'Backup Required',
  message: 'Last backup is 8 days old',
  priority: 'high',
  tags: ['floppy_disk', 'calendar'],
  actions: [{
    action: 'view',
    label: 'Run Backup',
    url: 'https://mealplanner.local/admin/backup'
  }]
});
```

### Shell Script Usage

```bash
#!/bin/bash

# Load configuration
NTFY_SERVER="${NTFY_SERVER_URL:-https://ntfy.sh}"
NTFY_TOPIC="${NTFY_TOPIC:-mealplanner-alerts}"

# Send notification
send_notification() {
  local title="$1"
  local message="$2"
  local priority="${3:-default}"
  local tags="${4:-information_source}"
  
  curl -H "Title: $title" \
       -H "Priority: $priority" \
       -H "Tags: $tags" \
       -d "$message" \
       "$NTFY_SERVER/$NTFY_TOPIC"
}

# Example: Backup success
if backup_database; then
  send_notification \
    "Database Backup Successful" \
    "Backup: backup-$(date +%Y%m%d).sql.gz (125MB)" \
    "default" \
    "white_check_mark,floppy_disk"
else
  send_notification \
    "Database Backup FAILED" \
    "Error: $ERROR_MESSAGE. Check logs and retry backup." \
    "urgent" \
    "rotating_light,warning"
fi
```

## Health Monitoring

The health monitor service automatically checks system health every 5 minutes (configurable) and sends notifications when thresholds are exceeded.

### Monitored Metrics

1. **Disk Usage**: Monitors data directory disk space
2. **Memory Usage**: Tracks system memory consumption
3. **Database Health**: Checks connectivity and response time
4. **Error Rate**: Calculates error rate from tracked errors
5. **Backup Age**: Warns if backups are too old

### Starting the Health Monitor

```typescript
import { healthMonitorService } from './services/healthMonitor.service';

// Start monitoring
healthMonitorService.start();

// Stop monitoring
healthMonitorService.stop();

// Manual health check
const result = await healthMonitorService.performHealthCheck();
console.log('Healthy:', result.healthy);
console.log('Alerts:', result.alerts);
```

### Integration with Application

Add to your application startup:

```typescript
// backend/src/index.ts
import { healthMonitorService } from './services/healthMonitor.service';
import { notificationService } from './services/notification.service';

// Start health monitoring if notifications enabled
if (notificationService.isEnabled()) {
  healthMonitorService.start();
  logger.info('Health monitoring started');
}
```

## Maintenance Integration

### Backup Scripts

Update backup scripts to send notifications:

```bash
# scripts/backup-full.sh
#!/bin/bash

# ... backup logic ...

if [ $? -eq 0 ]; then
  # Success notification
  curl -H "Title: Database Backup Successful" \
       -H "Priority: default" \
       -H "Tags: white_check_mark,floppy_disk" \
       -d "Backup: $BACKUP_FILE ($BACKUP_SIZE)" \
       "$NTFY_SERVER/$NTFY_TOPIC"
else
  # Failure notification
  curl -H "Title: Database Backup FAILED" \
       -H "Priority: urgent" \
       -H "Tags: rotating_light,warning" \
       -d "Error: $ERROR_MESSAGE. Check logs immediately." \
       "$NTFY_SERVER/$NTFY_TOPIC"
fi
```

### Weekly Maintenance Reminder

Set up a cron job to send weekly reminders:

```bash
# Crontab entry: Every Monday at 9 AM
0 9 * * 1 /path/to/send-maintenance-reminder.sh

# send-maintenance-reminder.sh
#!/bin/bash
curl -H "Title: Weekly Maintenance Due" \
     -H "Priority: default" \
     -H "Tags: clipboard,calendar" \
     -d "Time to run weekly maintenance checklist. Estimated: 15-25 minutes" \
     "$NTFY_SERVER/$NTFY_TOPIC"
```

Or use the service method:

```typescript
import { healthMonitorService } from './services/healthMonitor.service';

// Send maintenance reminder
await healthMonitorService.sendMaintenanceReminder();
```

## Rate Limiting

The notification service implements rate limiting to prevent spam:

- **Default limit**: 10 notifications per hour
- **Cooldown**: 15 minutes between duplicate alerts
- **Throttling**: 5 minutes minimum between similar notifications

Rate limits can be adjusted:

```typescript
notificationService.updateConfig({
  maxNotificationsPerHour: 20,  // Increase limit
});
```

## Quiet Hours

Configure quiet hours to suppress non-urgent notifications:

```bash
# In .env
NTFY_QUIET_HOURS={"start":"22:00","end":"08:00"}
```

- **Urgent notifications** always bypass quiet hours
- **High/default/low notifications** are delayed until quiet hours end
- Times are in 24-hour format (HH:MM)

## Notification History

View notification history and statistics:

```typescript
// Get last 100 notifications
const history = notificationService.getNotificationHistory(100);

// Get statistics
const stats = notificationService.getStats();
console.log('Total:', stats.total);
console.log('Successful:', stats.successful);
console.log('Failed:', stats.failed);
console.log('By priority:', stats.byPriority);

// Clear history
notificationService.clearHistory();
```

## Troubleshooting

### Notifications Not Received

1. **Check if enabled**:
   ```bash
   echo $NTFY_ENABLED  # Should be 'true'
   ```

2. **Verify topic subscription**:
   - Open ntfy app or web interface
   - Confirm you're subscribed to the correct topic

3. **Check logs**:
   ```bash
   tail -f logs/combined.log | grep -i notification
   ```

4. **Test manually**:
   ```bash
   curl -d "Test notification" https://ntfy.sh/YOUR_TOPIC
   ```

### Rate Limiting Issues

If notifications are being dropped:

```typescript
// Check current rate limit status
const stats = notificationService.getStats();
console.log('Notifications sent:', stats.total);

// Increase rate limit if needed
notificationService.updateConfig({
  maxNotificationsPerHour: 20
});
```

### Authentication Errors

If using private topics:

1. Verify token is correct
2. Check token hasn't expired
3. Ensure token has proper permissions
4. Test with curl:
   ```bash
   curl -H "Authorization: Bearer tk_xxxxx" \
        -d "Test" \
        https://ntfy.sh/YOUR_TOPIC
   ```

## Security Considerations

1. **Use unique topic names**: Prevents others from receiving your notifications
2. **Use private topics in production**: Requires authentication
3. **Rotate auth tokens periodically**: Generate new tokens every 90 days
4. **Don't include sensitive data**: Never send passwords, tokens, or PII
5. **Use Docker secrets**: Store auth tokens in `/run/secrets/`
6. **Monitor notification logs**: Review for suspicious activity

## Best Practices

1. **Start with public topic for testing**: Switch to private for production
2. **Set appropriate thresholds**: Avoid alert fatigue
3. **Use quiet hours**: Respect off-hours
4. **Test notifications regularly**: Ensure delivery works
5. **Monitor rate limits**: Adjust if hitting limits
6. **Document custom notifications**: Keep team informed
7. **Review notification history**: Identify patterns

## API Reference

### NotificationService

```typescript
class NotificationService {
  // Send notification
  send(options: NotificationOptions): Promise<boolean>
  
  // Convenience methods
  sendCritical(title: string, message: string, tags?: string[]): Promise<boolean>
  sendWarning(title: string, message: string, tags?: string[]): Promise<boolean>
  sendInfo(title: string, message: string, tags?: string[]): Promise<boolean>
  sendSuccess(title: string, message: string, tags?: string[]): Promise<boolean>
  
  // Configuration
  isEnabled(): boolean
  getConfig(): NotificationConfig
  updateConfig(updates: Partial<NotificationConfig>): void
  
  // History
  getNotificationHistory(limit?: number): NotificationLog[]
  clearHistory(): void
  getStats(): NotificationStats
}
```

### HealthMonitorService

```typescript
class HealthMonitorService {
  // Monitoring control
  start(): void
  stop(): void
  isActive(): boolean
  
  // Health checks
  performHealthCheck(): Promise<HealthCheckResult>
  getLastMetrics(): HealthMetrics | undefined
  
  // Error tracking
  trackError(message: string): void
  
  // Maintenance
  checkBackupAge(): Promise<void>
  sendMaintenanceReminder(): Promise<void>
  sendHealthSummary(): Promise<void>
}
```

## Related Documentation

- [ntfy.sh Documentation](https://docs.ntfy.sh/)
- [Weekly Maintenance Checklist](../WEEKLY_MAINTENANCE.md)
- [Monitoring Documentation](./MONITORING.md)
- [Database Backup Documentation](./DATABASE_BACKUP.md)

---

**Copyright (c) 2026 e2kd7n. All rights reserved.**

// Made with Bob