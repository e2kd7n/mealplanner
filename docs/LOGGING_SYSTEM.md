# Logging System Documentation

## Overview

The Meal Planner application uses a comprehensive logging system that captures both backend server logs and frontend client logs. All logs are centralized in `/mealplanner/logs` (production) or `./backend/logs` (development).

## Architecture

### Backend Logging (Winston)
- **Location**: `/mealplanner/logs` (production) or `./backend/logs` (development)
- **Files**:
  - `combined.log` - All log levels (info, warn, error, debug)
  - `error.log` - Error-level logs only
- **Rotation**: Automatic rotation at 10MB per file, keeps 10 files
- **Format**: JSON in production, colorized console in development

### Frontend Logging
- **Client-side logs** are batched and sent to `/api/logs/client`
- **Storage**: PostgreSQL database (`client_logs` table)
- **Features**: Batching, throttling, sampling, automatic sanitization
- **See**: [`FRONTEND_LOGGING.md`](FRONTEND_LOGGING.md) for details

## Log Pruning System

### Automatic Pruning
The log pruner runs automatically every 24 hours (configurable) and performs:

1. **File-based Log Pruning**:
   - Truncates files larger than 50MB (keeps last 25%)
   - Deletes files older than 30 days
   - Adds truncation notices to files

2. **Database Log Pruning**:
   - Deletes client logs older than 30 days
   - Prevents database bloat

### Configuration

Environment variables (in `backend/.env`):

```bash
# Log directory (default: ./logs in dev, /mealplanner/logs in production)
LOG_DIR=/mealplanner/logs

# Maximum log file size in MB before truncation (default: 50)
MAX_LOG_SIZE_MB=50

# Maximum age of log files in days before deletion (default: 30)
MAX_LOG_AGE_DAYS=30

# Maximum age of database logs in days before deletion (default: 30)
MAX_DATABASE_LOGS_DAYS=30

# Log pruning interval in milliseconds (default: 86400000 = 24 hours)
LOG_PRUNE_INTERVAL=86400000
```

### Manual Pruning

Admins can manually trigger log pruning via API:

```bash
# Trigger manual pruning
curl -X POST http://localhost:3000/api/logs/prune \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Log Statistics

View log statistics (admin only):

```bash
# Get file and database log stats
curl http://localhost:3000/api/logs/file-stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Response:
```json
{
  "fileStats": [
    {
      "file": "combined.log",
      "sizeMB": 0.85,
      "ageDays": 2.5
    },
    {
      "file": "error.log",
      "sizeMB": 0.16,
      "ageDays": 2.5
    }
  ],
  "databaseStats": {
    "totalLogs": 1234,
    "oldestLog": "2026-03-23T10:00:00.000Z",
    "newestLog": "2026-04-22T14:00:00.000Z"
  }
}
```

## Log Levels

### Backend (Winston)
- **ERROR**: Application errors, exceptions
- **WARN**: Warning conditions, deprecated features
- **INFO**: General informational messages
- **DEBUG**: Detailed debugging information

### Frontend (Client Logs)
- **error**: JavaScript errors, API failures
- **warn**: Performance warnings, deprecations
- **info**: User actions, analytics (if enabled)
- **debug**: Detailed debugging (rarely enabled)

## API Endpoints

### Client Log Submission
```
POST /api/logs/client
```
- **Public endpoint** (rate limited: 10 batches/minute)
- Accepts batched log entries from frontend
- Returns 202 Accepted immediately

### Admin Endpoints (Authentication Required)

```
GET /api/logs/client
```
- Retrieve client logs with filtering
- Query params: `level`, `context`, `sessionId`, `startDate`, `endDate`, `limit`, `offset`

```
GET /api/logs/stats
```
- Get aggregated log statistics
- Returns error counts, top contexts, top errors

```
GET /api/logs/file-stats
```
- Get file and database log statistics
- Shows file sizes, ages, and database counts

```
POST /api/logs/prune
```
- Manually trigger log pruning
- Prunes both files and database logs

```
DELETE /api/logs/old?daysOld=30
```
- Delete database logs older than specified days
- Default: 30 days

## Log Directory Structure

```
/mealplanner/logs/          # Production
  ├── combined.log          # All logs
  ├── combined.log.1        # Rotated logs
  ├── combined.log.2
  ├── ...
  ├── error.log             # Error logs only
  ├── error.log.1
  └── ...

./backend/logs/             # Development
  ├── combined.log
  └── error.log
```

## Security Considerations

### Sensitive Data Protection
- **Automatic sanitization** of passwords, tokens, secrets, API keys
- **No PII** logged by default
- **Configurable** data inclusion

### Access Control
- Log viewing endpoints require **admin authentication**
- Client log submission is **rate limited**
- Database logs have **automatic expiration**

### Log Rotation
- Prevents disk space exhaustion
- Automatic cleanup of old logs
- Configurable retention periods

## Monitoring Best Practices

### 1. Regular Review
- Check log statistics weekly
- Monitor error rates and patterns
- Identify recurring issues

### 2. Alerting
- Set up alerts for critical errors
- Monitor log file sizes
- Track database log growth

### 3. Analysis
- Use log aggregation tools (Elasticsearch, Splunk)
- Create dashboards for key metrics
- Correlate frontend and backend errors

### 4. Retention
- Balance storage costs with debugging needs
- Adjust retention periods based on usage
- Archive important logs before deletion

## Troubleshooting

### Logs Not Being Created
1. Check directory permissions: `/mealplanner/logs` must be writable
2. Verify `LOG_DIR` environment variable
3. Check backend startup logs for errors

### Logs Growing Too Large
1. Reduce `MAX_LOG_SIZE_MB` setting
2. Decrease `MAX_LOG_AGE_DAYS` for faster cleanup
3. Increase `LOG_PRUNE_INTERVAL` for more frequent pruning
4. Adjust log level to reduce verbosity

### Database Logs Growing
1. Reduce `MAX_DATABASE_LOGS_DAYS`
2. Check frontend log sampling rate
3. Verify rate limiting is working
4. Manually trigger pruning if needed

### Missing Frontend Logs
1. Verify `/api/logs/client` endpoint is accessible
2. Check browser console for network errors
3. Ensure frontend logger is enabled (production only by default)
4. Check rate limiting isn't blocking requests

## Performance Impact

### Backend Logging
- **Minimal**: Async file writes, buffered I/O
- **Rotation**: Happens in background, no blocking
- **Pruning**: Runs during low-traffic periods (configurable)

### Frontend Logging
- **Batching**: Reduces network requests
- **Sampling**: Configurable to reduce load
- **Async**: Uses `sendBeacon` for non-blocking transmission
- **Throttling**: Prevents log spam

## Production Deployment

### Docker/Podman Setup
The log directory is automatically created and mounted:

```yaml
# podman-compose.yml
volumes:
  - ./logs:/mealplanner/logs
```

### Environment Configuration
```bash
# Production settings
NODE_ENV=production
LOG_LEVEL=info
LOG_FORMAT=json
LOG_DIR=/mealplanner/logs
MAX_LOG_SIZE_MB=50
MAX_LOG_AGE_DAYS=30
```

### Backup Considerations
- Logs are stored in `./logs` directory (not in container)
- Persist across container restarts
- Include in backup strategy if needed
- Consider log shipping to external service

## Related Documentation

- [`FRONTEND_LOGGING.md`](FRONTEND_LOGGING.md) - Frontend logging details
- [`MONITORING.md`](MONITORING.md) - Application monitoring
- [`SECURITY_SETUP.md`](SECURITY_SETUP.md) - Security configuration

---

**Made with Bob**