#!/bin/bash

# Raspberry Pi Diagnostics and Telemetry Script
# Gathers comprehensive metrics for optimization analysis

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Output file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="./diagnostics"
OUTPUT_FILE="$OUTPUT_DIR/pi-diagnostics-$TIMESTAMP.log"
JSON_FILE="$OUTPUT_DIR/pi-diagnostics-$TIMESTAMP.json"

mkdir -p "$OUTPUT_DIR"

echo "🔍 Raspberry Pi Diagnostics & Telemetry" | tee "$OUTPUT_FILE"
echo "=======================================" | tee -a "$OUTPUT_FILE"
echo "Timestamp: $(date)" | tee -a "$OUTPUT_FILE"
echo "" | tee -a "$OUTPUT_FILE"

# Start JSON output
cat > "$JSON_FILE" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "hostname": "$(hostname)",
EOF

# Function to add section header
section_header() {
    echo "" | tee -a "$OUTPUT_FILE"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$OUTPUT_FILE"
    echo -e "${YELLOW}$1${NC}" | tee -a "$OUTPUT_FILE"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$OUTPUT_FILE"
    echo "" | tee -a "$OUTPUT_FILE"
}

# System Information
section_header "📊 SYSTEM INFORMATION"
{
    echo "Hostname: $(hostname)"
    echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
    echo "Kernel: $(uname -r)"
    echo "Architecture: $(uname -m)"
    echo "Uptime: $(uptime -p)"
} | tee -a "$OUTPUT_FILE"

# Hardware Information
section_header "🖥️  HARDWARE INFORMATION"
{
    echo "CPU Model: $(cat /proc/cpuinfo | grep 'Model' | head -1 | cut -d':' -f2 | xargs)"
    echo "CPU Cores: $(nproc)"
    echo "CPU Frequency: $(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq 2>/dev/null | awk '{print $1/1000 " MHz"}' || echo 'N/A')"
    echo "Total RAM: $(free -h | awk '/^Mem:/ {print $2}')"
    echo "Temperature: $(vcgencmd measure_temp 2>/dev/null || echo 'N/A')"
} | tee -a "$OUTPUT_FILE"

# Memory Usage
section_header "💾 MEMORY USAGE"
{
    free -h
    echo ""
    echo "Memory Breakdown:"
    ps aux --sort=-%mem | head -11 | awk '{printf "%-20s %6s %6s %s\n", $11, $4"%", $6, $3"%"}'
} | tee -a "$OUTPUT_FILE"

# Disk Usage
section_header "💿 DISK USAGE"
{
    df -h | grep -E '^/dev/|Filesystem'
    echo ""
    echo "Largest directories in /:"
    du -h --max-depth=1 / 2>/dev/null | sort -hr | head -10 || echo "Permission denied for some directories"
} | tee -a "$OUTPUT_FILE"

# Container Statistics
section_header "🐳 CONTAINER STATISTICS"
if command -v podman &> /dev/null; then
    {
        echo "Podman Version: $(podman --version)"
        echo ""
        echo "Container Status:"
        podman ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Size}}"
        echo ""
        echo "Image Sizes:"
        podman images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.Created}}"
        echo ""
        echo "System Disk Usage:"
        podman system df
        echo ""
        echo "Container Resource Usage:"
        podman stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
    } | tee -a "$OUTPUT_FILE"
else
    echo "Podman not installed" | tee -a "$OUTPUT_FILE"
fi

# Network Statistics
section_header "🌐 NETWORK STATISTICS"
{
    echo "Network Interfaces:"
    ip -br addr
    echo ""
    echo "Active Connections:"
    ss -tuln | grep LISTEN | head -20
    echo ""
    echo "Network Traffic:"
    cat /proc/net/dev | awk 'NR>2 {printf "%-10s RX: %10d bytes TX: %10d bytes\n", $1, $2, $10}'
} | tee -a "$OUTPUT_FILE"

# Application-Specific Metrics
section_header "📱 APPLICATION METRICS"
if podman ps | grep -q meals-backend; then
    {
        echo "Backend Container Logs (last 50 lines):"
        podman logs --tail 50 meals-backend 2>&1 | grep -E 'error|Error|ERROR|warn|Warn|WARN|started|listening' || echo "No significant log entries"
        echo ""
        echo "Backend Container Inspect:"
        podman inspect meals-backend --format '{{json .State}}' | jq '.' 2>/dev/null || echo "jq not available"
    } | tee -a "$OUTPUT_FILE"
else
    echo "Backend container not running" | tee -a "$OUTPUT_FILE"
fi

if podman ps | grep -q meals-postgres; then
    {
        echo ""
        echo "Database Size:"
        podman exec meals-postgres psql -U postgres -d mealplanner -c "SELECT pg_size_pretty(pg_database_size('mealplanner')) as size;" 2>/dev/null || echo "Cannot connect to database"
        echo ""
        echo "Database Table Sizes:"
        podman exec meals-postgres psql -U postgres -d mealplanner -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;" 2>/dev/null || echo "Cannot query database"
    } | tee -a "$OUTPUT_FILE"
else
    echo "Database container not running" | tee -a "$OUTPUT_FILE"
fi

# Performance Metrics
section_header "⚡ PERFORMANCE METRICS"
{
    echo "CPU Load Average (1m, 5m, 15m):"
    uptime | awk -F'load average:' '{print $2}'
    echo ""
    echo "CPU Usage per Core:"
    mpstat -P ALL 1 1 2>/dev/null || echo "mpstat not available (install sysstat)"
    echo ""
    echo "I/O Statistics:"
    iostat -x 1 2 2>/dev/null | tail -n +4 || echo "iostat not available (install sysstat)"
    echo ""
    echo "Top Processes by CPU:"
    ps aux --sort=-%cpu | head -11 | awk '{printf "%-20s %6s %6s %s\n", $11, $3"%", $4"%", $2}'
} | tee -a "$OUTPUT_FILE"

# Container Layer Analysis
section_header "🔬 CONTAINER LAYER ANALYSIS"
if command -v podman &> /dev/null; then
    {
        echo "Backend Image Layers:"
        podman history meals-backend:latest --format "table {{.CreatedBy}}\t{{.Size}}" | head -20
        echo ""
        echo "Frontend Image Layers:"
        podman history meals-frontend:latest --format "table {{.CreatedBy}}\t{{.Size}}" | head -20
    } | tee -a "$OUTPUT_FILE"
fi

# Dependency Analysis
section_header "📦 DEPENDENCY ANALYSIS"
if podman ps | grep -q meals-backend; then
    {
        echo "Backend Node Modules Count:"
        podman exec meals-backend sh -c "find /app/node_modules -maxdepth 2 -type d | wc -l" 2>/dev/null || echo "Cannot access container"
        echo ""
        echo "Backend Node Modules Size:"
        podman exec meals-backend sh -c "du -sh /app/node_modules" 2>/dev/null || echo "Cannot access container"
        echo ""
        echo "Largest Backend Dependencies:"
        podman exec meals-backend sh -c "du -sh /app/node_modules/* 2>/dev/null | sort -hr | head -20" || echo "Cannot access container"
    } | tee -a "$OUTPUT_FILE"
fi

# Service Response Times
section_header "⏱️  SERVICE RESPONSE TIMES"
{
    echo "Testing API endpoints..."
    if curl -s -o /dev/null -w "Health endpoint: %{time_total}s\n" http://localhost:3000/health 2>/dev/null; then
        curl -s -o /dev/null -w "Health endpoint: %{time_total}s\n" http://localhost:3000/health
    else
        echo "Backend not accessible"
    fi
    
    if curl -s -o /dev/null -w "Frontend: %{time_total}s\n" http://localhost:8080 2>/dev/null; then
        curl -s -o /dev/null -w "Frontend: %{time_total}s\n" http://localhost:8080
    else
        echo "Frontend not accessible"
    fi
} | tee -a "$OUTPUT_FILE"

# Optimization Recommendations
section_header "💡 OPTIMIZATION RECOMMENDATIONS"
{
    echo "Analyzing system for optimization opportunities..."
    echo ""
    
    # Check memory usage
    MEM_USAGE=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
    if [ "$MEM_USAGE" -gt 80 ]; then
        echo "⚠️  HIGH MEMORY USAGE ($MEM_USAGE%): Consider adding swap or reducing container memory limits"
    else
        echo "✓ Memory usage is acceptable ($MEM_USAGE%)"
    fi
    
    # Check disk usage
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 80 ]; then
        echo "⚠️  HIGH DISK USAGE ($DISK_USAGE%): Run cleanup script or expand storage"
    else
        echo "✓ Disk usage is acceptable ($DISK_USAGE%)"
    fi
    
    # Check container count
    CONTAINER_COUNT=$(podman ps -a | wc -l)
    if [ "$CONTAINER_COUNT" -gt 10 ]; then
        echo "⚠️  Many containers ($CONTAINER_COUNT): Consider pruning unused containers"
    else
        echo "✓ Container count is reasonable ($CONTAINER_COUNT)"
    fi
    
    # Check image count
    IMAGE_COUNT=$(podman images | wc -l)
    if [ "$IMAGE_COUNT" -gt 20 ]; then
        echo "⚠️  Many images ($IMAGE_COUNT): Consider pruning unused images"
    else
        echo "✓ Image count is reasonable ($IMAGE_COUNT)"
    fi
    
    # Check CPU temperature
    if command -v vcgencmd &> /dev/null; then
        TEMP=$(vcgencmd measure_temp | grep -o '[0-9.]*')
        if (( $(echo "$TEMP > 70" | bc -l) )); then
            echo "⚠️  HIGH CPU TEMPERATURE (${TEMP}°C): Consider improving cooling"
        else
            echo "✓ CPU temperature is acceptable (${TEMP}°C)"
        fi
    fi
    
    echo ""
    echo "Specific Optimization Suggestions:"
    echo "1. Enable log rotation to prevent disk fill"
    echo "2. Schedule regular database vacuuming"
    echo "3. Implement image caching for recipe images"
    echo "4. Consider using Alpine-based images for smaller footprint"
    echo "5. Review and remove unused dependencies"
} | tee -a "$OUTPUT_FILE"

# Generate JSON summary
cat >> "$JSON_FILE" <<EOF
  "system": {
    "hostname": "$(hostname)",
    "os": "$(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)",
    "kernel": "$(uname -r)",
    "architecture": "$(uname -m)",
    "uptime_seconds": $(cat /proc/uptime | awk '{print int($1)}')
  },
  "hardware": {
    "cpu_cores": $(nproc),
    "total_ram_mb": $(free -m | awk '/^Mem:/ {print $2}'),
    "temperature_celsius": $(vcgencmd measure_temp 2>/dev/null | grep -o '[0-9.]*' || echo 0)
  },
  "memory": {
    "total_mb": $(free -m | awk '/^Mem:/ {print $2}'),
    "used_mb": $(free -m | awk '/^Mem:/ {print $3}'),
    "free_mb": $(free -m | awk '/^Mem:/ {print $4}'),
    "usage_percent": $(free | awk '/Mem:/ {printf "%.1f", $3/$2 * 100}')
  },
  "disk": {
    "total_gb": $(df -BG / | awk 'NR==2 {print $2}' | sed 's/G//'),
    "used_gb": $(df -BG / | awk 'NR==2 {print $3}' | sed 's/G//'),
    "available_gb": $(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//'),
    "usage_percent": $(df / | awk 'NR==2 {print $5}' | sed 's/%//')
  },
  "containers": {
    "running": $(podman ps -q 2>/dev/null | wc -l || echo 0),
    "total": $(podman ps -aq 2>/dev/null | wc -l || echo 0),
    "images": $(podman images -q 2>/dev/null | wc -l || echo 0)
  }
}
EOF

# Summary
section_header "📋 SUMMARY"
{
    echo "Diagnostics complete!"
    echo ""
    echo "Reports saved to:"
    echo "  - Detailed log: $OUTPUT_FILE"
    echo "  - JSON data: $JSON_FILE"
    echo ""
    echo "Key Metrics:"
    echo "  - Memory Usage: $(free | awk '/Mem:/ {printf "%.1f%%", $3/$2 * 100}')"
    echo "  - Disk Usage: $(df / | awk 'NR==2 {print $5}')"
    echo "  - Running Containers: $(podman ps -q 2>/dev/null | wc -l || echo 0)"
    echo "  - CPU Temperature: $(vcgencmd measure_temp 2>/dev/null || echo 'N/A')"
    echo ""
    echo "Review the detailed log for optimization opportunities."
} | tee -a "$OUTPUT_FILE"

echo ""
echo -e "${GREEN}✅ Diagnostics complete! Check $OUTPUT_FILE for details.${NC}"

# Made with Bob