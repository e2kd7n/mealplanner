#!/bin/bash
# Pi Cluster Monitoring Commands - Run these after SSH'ing into admin@192.168.4.110
# Generated: 2026-06-11

echo "=== Pi Cluster Health Monitoring - Past Week ==="
echo ""

# 1. Current System Health
echo "1. CURRENT SYSTEM HEALTH"
echo "========================"
cd ~/mealplanner
./scripts/pi-health-check.sh
echo ""

# 2. Check Pi Stats File (shared infrastructure monitoring)
echo "2. PI INFRASTRUCTURE STATS"
echo "=========================="
if [ -f ~/pi-stats.txt ]; then
    echo "Last updated: $(stat -c %y ~/pi-stats.txt 2>/dev/null || stat -f %Sm ~/pi-stats.txt)"
    cat ~/pi-stats.txt
else
    echo "Pi stats file not found at ~/pi-stats.txt"
fi
echo ""

# 3. Container Status and Resource Usage
echo "3. CONTAINER STATUS & RESOURCES"
echo "================================"
podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Container Resource Usage:"
podman stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
echo ""

# 4. Application Logs - Past Week
echo "4. APPLICATION LOGS (Past 7 Days)"
echo "=================================="
echo "Backend errors:"
podman logs meals-backend --since 168h 2>&1 | grep -i "error" | tail -20
echo ""
echo "Nginx access summary:"
podman logs meals-nginx --since 168h 2>&1 | grep -E "GET|POST" | wc -l
echo "requests in past week"
echo ""

# 5. Database Health
echo "5. DATABASE HEALTH"
echo "=================="
podman exec meals-postgres psql -U mealplanner -d meal_planner -c "SELECT 
    pg_size_pretty(pg_database_size('meal_planner')) as db_size,
    (SELECT count(*) FROM pg_stat_activity WHERE datname='meal_planner') as active_connections;"
echo ""

# 6. System Uptime and Load
echo "6. SYSTEM METRICS"
echo "================="
uptime
echo ""
free -h
echo ""
df -h / | tail -1
echo ""

# 7. Temperature History (if available)
echo "7. TEMPERATURE CHECK"
echo "===================="
vcgencmd measure_temp
echo ""

# 8. Recent Journal Errors
echo "8. SYSTEM JOURNAL ERRORS (Past 7 Days)"
echo "======================================="
sudo journalctl --since "7 days ago" -p err -n 20 --no-pager
echo ""

# 9. ClusterHAT Status (if applicable)
echo "9. CLUSTERHAT STATUS"
echo "===================="
if command -v clusterhat &> /dev/null; then
    clusterhat status
else
    echo "ClusterHAT command not found - checking Zero W nodes manually..."
    for i in {1..4}; do
        echo -n "Node p$i (172.19.180.$i): "
        timeout 2 bash -c "echo > /dev/tcp/172.19.180.$i/3001" 2>/dev/null && echo "UP" || echo "DOWN"
    done
fi
echo ""

# 10. Maintenance Logs
echo "10. RECENT MAINTENANCE LOGS"
echo "==========================="
if [ -d ~/mealplanner/data/maintenance-logs ]; then
    echo "Recent maintenance activities:"
    ls -lht ~/mealplanner/data/maintenance-logs/*.md 2>/dev/null | head -5
fi
echo ""

echo "=== Monitoring Complete ==="
echo ""
echo "To save this output, run:"
echo "bash pi-monitoring-commands.sh > monitoring-report-$(date +%Y%m%d).txt"

# Made with Bob
