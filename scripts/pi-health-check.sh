#!/bin/bash
# Raspberry Pi Health Check Script
# Based on PI_OPTIMIZATION_PROPOSAL.md recommendations
# Monitors temperature, memory, disk, and container health

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Thresholds
TEMP_WARNING=65
TEMP_CRITICAL=70
MEM_WARNING=70
MEM_CRITICAL=85
DISK_WARNING=75
DISK_CRITICAL=85
SWAP_WARNING=30
SWAP_CRITICAL=60

# Get metrics
TEMP=$(vcgencmd measure_temp 2>/dev/null | cut -d= -f2 | cut -d\' -f1 || echo "0")
MEM_USED=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
DISK_USED=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
SWAP_USED=$(free | awk '/Swap:/ {if ($2 > 0) printf "%.0f", $3/$2 * 100; else print "0"}')
CPU_LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')

# Status tracking
ALERTS=0
WARNINGS=0

echo -e "${BLUE}=== Raspberry Pi Health Check ===${NC}"
echo -e "${BLUE}Timestamp: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# Temperature Check
echo -e "${BLUE}🌡️  Temperature:${NC} ${TEMP}°C"
if (( $(echo "$TEMP > $TEMP_CRITICAL" | bc -l 2>/dev/null || echo 0) )); then
    echo -e "${RED}   ❌ CRITICAL: Temperature above ${TEMP_CRITICAL}°C${NC}"
    ((ALERTS++))
elif (( $(echo "$TEMP > $TEMP_WARNING" | bc -l 2>/dev/null || echo 0) )); then
    echo -e "${YELLOW}   ⚠️  WARNING: Temperature above ${TEMP_WARNING}°C${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}   ✓ Normal${NC}"
fi

# Memory Check
echo -e "${BLUE}💾 Memory Usage:${NC} ${MEM_USED}%"
if [ "$MEM_USED" -gt "$MEM_CRITICAL" ]; then
    echo -e "${RED}   ❌ CRITICAL: Memory usage above ${MEM_CRITICAL}%${NC}"
    ((ALERTS++))
elif [ "$MEM_USED" -gt "$MEM_WARNING" ]; then
    echo -e "${YELLOW}   ⚠️  WARNING: Memory usage above ${MEM_WARNING}%${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}   ✓ Normal${NC}"
fi

# Swap Check
echo -e "${BLUE}🔄 Swap Usage:${NC} ${SWAP_USED}%"
if [ "$SWAP_USED" -gt "$SWAP_CRITICAL" ]; then
    echo -e "${RED}   ❌ CRITICAL: Swap usage above ${SWAP_CRITICAL}%${NC}"
    ((ALERTS++))
elif [ "$SWAP_USED" -gt "$SWAP_WARNING" ]; then
    echo -e "${YELLOW}   ⚠️  WARNING: Swap usage above ${SWAP_WARNING}%${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}   ✓ Normal${NC}"
fi

# Disk Check
echo -e "${BLUE}💿 Disk Usage:${NC} ${DISK_USED}%"
if [ "$DISK_USED" -gt "$DISK_CRITICAL" ]; then
    echo -e "${RED}   ❌ CRITICAL: Disk usage above ${DISK_CRITICAL}%${NC}"
    ((ALERTS++))
elif [ "$DISK_USED" -gt "$DISK_WARNING" ]; then
    echo -e "${YELLOW}   ⚠️  WARNING: Disk usage above ${DISK_WARNING}%${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}   ✓ Normal${NC}"
fi

# CPU Load Check
echo -e "${BLUE}⚙️  CPU Load (1m):${NC} ${CPU_LOAD}"
if (( $(echo "$CPU_LOAD > 3.5" | bc -l 2>/dev/null || echo 0) )); then
    echo -e "${RED}   ❌ CRITICAL: Load above 3.5 on 4-core system${NC}"
    ((ALERTS++))
elif (( $(echo "$CPU_LOAD > 2.0" | bc -l 2>/dev/null || echo 0) )); then
    echo -e "${YELLOW}   ⚠️  WARNING: Load above 2.0${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}   ✓ Normal${NC}"
fi

# Container Health Check
echo ""
echo -e "${BLUE}🐳 Container Status:${NC}"
if command -v podman &> /dev/null; then
    RUNNING=$(podman ps --filter "name=meals-" --format "{{.Names}}" 2>/dev/null | wc -l)
    EXPECTED=4  # postgres, backend, frontend, nginx
    
    if [ "$RUNNING" -eq "$EXPECTED" ]; then
        echo -e "${GREEN}   ✓ All $EXPECTED containers running${NC}"
        podman ps --filter "name=meals-" --format "table {{.Names}}\t{{.Status}}" 2>/dev/null
    elif [ "$RUNNING" -gt 0 ]; then
        echo -e "${YELLOW}   ⚠️  Only $RUNNING/$EXPECTED containers running${NC}"
        ((WARNINGS++))
        podman ps -a --filter "name=meals-" --format "table {{.Names}}\t{{.Status}}" 2>/dev/null
    else
        echo -e "${YELLOW}   ℹ️  No meal planner containers running${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠️  Podman not installed${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}=== Summary ===${NC}"
if [ "$ALERTS" -gt 0 ]; then
    echo -e "${RED}❌ ${ALERTS} CRITICAL alert(s)${NC}"
elif [ "$WARNINGS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  ${WARNINGS} warning(s)${NC}"
else
    echo -e "${GREEN}✅ All systems healthy${NC}"
fi

# Exit with appropriate code
if [ "$ALERTS" -gt 0 ]; then
    exit 2
elif [ "$WARNINGS" -gt 0 ]; then
    exit 1
else
    exit 0
fi

# Made with Bob