# Monitoring and Alerting

## Overview

The Meal Planner application includes comprehensive monitoring capabilities to track application health, performance metrics, and system resources.

## Health Check Endpoints

### `/health` - Comprehensive Health Check

Returns detailed health information including:
- Overall application status
- System information (CPU, memory, load average)
- Process metrics (memory usage, CPU usage)
- Request metrics (total, success rate, response times)
- Database connectivity and latency
- Uptime

**Example Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-23T14:00:00.000Z",
  "uptime": 3600,
  "system": {
    "platform": "linux",
    "arch": "x64",
    "nodeVersion": "v20.11.0",
    "cpus": 4,
    "totalMemory": 8589934592,
    "freeMemory": 4294967296,
    "loadAverage": [0.5, 0.4, 0.3]
  },
  "process": {
    "pid": 1,
    "memory": {
      "rss": 52428800,
      "heapTotal": 20971520,
      "heapUsed": 15728640,
      "external": 1048576
    },
    "cpu": {
      "user": 1000000,
      "system": 500000
    }
  },
  "metrics": {
    "requests": {
      "total": 1000,
      "success": 950,
      "errors": 50,
      "lastMinute": 10
    },
    "responseTime": {
      "avg": 45,
      "p95": 120,
      "p99": 250
    }
  },
  "services": {
    "database": {
      "healthy": true,
      "latency": 5
    }
  }
}
```

### `/health/live` - Simple Liveness Check

Lightweight endpoint for load balancers and orchestrators.

**Example Response:**
```json
{
  "status": "ok"
}
```

## Metrics Tracked

### Request Metrics
- **Total Requests**: Cumulative count of all requests
- **Success Rate**: Percentage of successful requests (status < 400)
- **Error Rate**: Percentage of failed requests (status >= 400)
- **Requests Per Minute**: Current request rate

### Response Time Metrics
- **Average**: Mean response time across all requests
- **P95**: 95th percentile response time
- **P99**: 99th percentile response time

### System Metrics
- **CPU Usage**: User and system CPU time
- **Memory Usage**: RSS, heap total, heap used, external memory
- **Load Average**: 1, 5, and 15-minute load averages
- **Uptime**: Application uptime in seconds

### Service Health
- **Database**: Connectivity status and query latency

## Monitoring Integration

### Prometheus

The health endpoint can be scraped by Prometheus for metrics collection:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'meal-planner'
    scrape_interval: 30s
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/health'
```

### Grafana Dashboard

Create a Grafana dashboard to visualize:
1. Request rate and error rate over time
2. Response time percentiles (P50, P95, P99)
3. Memory and CPU usage trends
4. Database latency
5. Service uptime

### Alerting Rules

Recommended alert thresholds:

**Critical Alerts:**
- Database unhealthy
- Error rate > 10%
- P99 response time > 5000ms
- Memory usage > 90%

**Warning Alerts:**
- Error rate > 5%
- P95 response time > 1000ms
- Memory usage > 75%
- Database latency > 100ms

## Usage

### Check Application Health

```bash
curl http://localhost:8080/health
```

### Monitor in Real-Time

```bash
watch -n 5 'curl -s http://localhost:8080/health | jq'
```

### Check Specific Metrics

```bash
# Check error rate
curl -s http://localhost:8080/health | jq '.metrics.requests | {total, errors, error_rate: (.errors / .total * 100)}'

# Check response times
curl -s http://localhost:8080/health | jq '.metrics.responseTime'

# Check database health
curl -s http://localhost:8080/health | jq '.services.database'
```

## Implementation Details

### Metrics Collection

The `metricsMiddleware` automatically tracks:
- Request count
- Success/failure status
- Response time for each request

Metrics are stored in memory with a rolling window of the last 1000 requests for percentile calculations.

### Health Checks

Health checks run on-demand when the `/health` endpoint is called. They include:
1. System resource checks (CPU, memory)
2. Database connectivity test
3. Metrics aggregation

### Performance Impact

The monitoring system is designed to have minimal performance impact:
- Metrics tracking adds < 1ms per request
- Health checks are async and non-blocking
- Memory footprint is bounded (last 1000 response times)

## Future Enhancements

Planned improvements (see issue #42):
- [ ] Prometheus metrics endpoint (`/metrics`)
- [ ] Custom business metrics (recipes created, meal plans generated)
- [ ] Distributed tracing integration
- [ ] Log aggregation
- [ ] Automated alerting via AlertManager
- [ ] Performance profiling endpoints

## Related Documentation

- [CODE_REVIEW_SUMMARY.md](CODE_REVIEW_SUMMARY.md) - Monitoring recommendations
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment with monitoring
- [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md) - Development best practices

---

**Last Updated:** March 23, 2026  
**Status:** ✅ Basic monitoring implemented  
**Next Steps:** Integrate with Prometheus/Grafana for visualization

---

*Made with Bob*