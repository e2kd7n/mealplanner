#!/bin/bash
# Raspberry Pi Health Check Script
# Based on PI_OPTIMIZATION_PROPOSAL.md recommendations
# Monitors temperature, memory, disk, and container health

set -e

# Load common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# Get metrics
TEMP=$(get_cpu_temp)
MEM_USED=$(get_memory_usage)
DISK_USED=$(get_disk_usage_percent)
SWAP_USED=$(get_swap_usage)
CPU_LOAD=$(get_cpu_load)

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
show_container_status
CONTAINER_CMD=$(detect_container_runtime)
if [ -n "$CONTAINER_CMD" ]; then
    RUNNING=$($CONTAINER_CMD ps --filter "name=meals-" --format "{{.Names}}" 2>/dev/null | wc -l)
    EXPECTED=4
    if [ "$RUNNING" -lt "$EXPECTED" ] && [ "$RUNNING" -gt 0 ]; then
        ((WARNINGS++))
    fi
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