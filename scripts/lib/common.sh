#!/bin/bash
# Common utility functions for Pi scripts
# Source this file in other scripts: source "$(dirname "$0")/lib/common.sh"

# Colors for output
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export CYAN='\033[0;36m'
export NC='\033[0m' # No Color

# Thresholds for health checks
export TEMP_WARNING=65
export TEMP_CRITICAL=70
export MEM_WARNING=70
export MEM_CRITICAL=85
export DISK_WARNING=75
export DISK_CRITICAL=85
export SWAP_WARNING=30
export SWAP_CRITICAL=60

# Show disk usage in a consistent format
show_disk_usage() {
    echo -e "${BLUE}💾 Current disk usage:${NC}"
    df -h / | grep -v Filesystem
    echo ""
}

# Get disk usage percentage
get_disk_usage_percent() {
    df / | awk 'NR==2 {print $5}' | sed 's/%//'
}

# Get disk usage in KB
get_disk_usage_kb() {
    df / | awk 'NR==2 {print $3}'
}

# Calculate and display space freed
show_space_freed() {
    local disk_before=$1
    local disk_after=$2
    local disk_freed=$((disk_before - disk_after))
    local disk_freed_mb=$((disk_freed / 1024))
    
    if [ "$disk_freed_mb" -gt 1024 ]; then
        local disk_freed_gb=$(echo "scale=2; $disk_freed_mb / 1024" | bc 2>/dev/null || echo "0")
        echo -e "${GREEN}🎉 Freed ${disk_freed_gb}GB of disk space!${NC}"
    else
        echo -e "${GREEN}🎉 Freed ${disk_freed_mb}MB of disk space!${NC}"
    fi
}

# Get CPU temperature
get_cpu_temp() {
    vcgencmd measure_temp 2>/dev/null | cut -d= -f2 | cut -d\' -f1 || echo "0"
}

# Get memory usage percentage
get_memory_usage() {
    free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}'
}

# Get swap usage percentage
get_swap_usage() {
    free | awk '/Swap:/ {if ($2 > 0) printf "%.0f", $3/$2 * 100; else print "0"}'
}

# Get CPU load average (1 minute)
get_cpu_load() {
    uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//'
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        echo -e "${RED}❌ This script must be run as root or with sudo${NC}"
        echo -e "${YELLOW}Usage: sudo $0${NC}"
        exit 1
    fi
}

# Detect container runtime (podman or docker)
detect_container_runtime() {
    if command -v podman &> /dev/null; then
        echo "podman"
    elif command -v docker &> /dev/null; then
        echo "docker"
    else
        echo ""
    fi
}

# Clean podman/docker system
clean_container_system() {
    local container_cmd=$1
    
    if [ -z "$container_cmd" ]; then
        echo -e "${YELLOW}⚠️  No container runtime found${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}🧹 Cleaning $container_cmd system...${NC}"
    $container_cmd system prune -f 2>/dev/null || true
    $container_cmd image prune -a -f 2>/dev/null || true
    $container_cmd builder prune -af 2>/dev/null || true
    echo -e "${GREEN}✓ $container_cmd system cleaned${NC}"
}

# Clean journal logs
clean_journal_logs() {
    local size_limit=${1:-100M}
    local time_limit=${2:-7d}
    
    echo -e "${YELLOW}🧹 Cleaning systemd journal logs...${NC}"
    
    if [ "$EUID" -ne 0 ]; then
        sudo journalctl --vacuum-size=$size_limit 2>/dev/null || true
        sudo journalctl --vacuum-time=$time_limit 2>/dev/null || true
    else
        journalctl --vacuum-size=$size_limit 2>/dev/null || true
        journalctl --vacuum-time=$time_limit 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✓ Journal logs cleaned${NC}"
}

# Clean package manager caches
clean_package_caches() {
    echo -e "${YELLOW}🧹 Cleaning package manager caches...${NC}"
    
    # npm
    if command -v npm &> /dev/null; then
        npm cache clean --force 2>/dev/null || true
        echo -e "  ${GREEN}✓ npm cache cleared${NC}"
    fi
    
    # pnpm
    if command -v pnpm &> /dev/null; then
        pnpm store prune 2>/dev/null || true
        echo -e "  ${GREEN}✓ pnpm store pruned${NC}"
    fi
    
    # yarn
    if command -v yarn &> /dev/null; then
        yarn cache clean 2>/dev/null || true
        echo -e "  ${GREEN}✓ yarn cache cleared${NC}"
    fi
}

# Clean APT cache
clean_apt_cache() {
    echo -e "${YELLOW}🧹 Cleaning APT cache...${NC}"
    
    if [ "$EUID" -ne 0 ]; then
        sudo apt-get clean 2>/dev/null || true
        sudo apt-get autoremove -y 2>/dev/null || true
    else
        apt-get clean 2>/dev/null || true
        apt-get autoremove -y 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✓ APT cache cleared${NC}"
}

# Show container status
show_container_status() {
    local container_cmd=$(detect_container_runtime)
    
    if [ -z "$container_cmd" ]; then
        echo -e "${YELLOW}⚠️  No container runtime installed${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🐳 Container Status:${NC}"
    local running=$($container_cmd ps --filter "name=meals-" --format "{{.Names}}" 2>/dev/null | wc -l)
    local expected=4  # postgres, backend, frontend, nginx
    
    if [ "$running" -eq "$expected" ]; then
        echo -e "${GREEN}   ✓ All $expected containers running${NC}"
        $container_cmd ps --filter "name=meals-" --format "table {{.Names}}\t{{.Status}}" 2>/dev/null
    elif [ "$running" -gt 0 ]; then
        echo -e "${YELLOW}   ⚠️  Only $running/$expected containers running${NC}"
        $container_cmd ps -a --filter "name=meals-" --format "table {{.Names}}\t{{.Status}}" 2>/dev/null
    else
        echo -e "${YELLOW}   ℹ️  No meal planner containers running${NC}"
    fi
}

# Check health status and return exit code
check_health_status() {
    local temp=$(get_cpu_temp)
    local mem_used=$(get_memory_usage)
    local disk_used=$(get_disk_usage_percent)
    local swap_used=$(get_swap_usage)
    local cpu_load=$(get_cpu_load)
    
    local alerts=0
    local warnings=0
    
    # Temperature check
    if (( $(echo "$temp > $TEMP_CRITICAL" | bc -l 2>/dev/null || echo 0) )); then
        ((alerts++))
    elif (( $(echo "$temp > $TEMP_WARNING" | bc -l 2>/dev/null || echo 0) )); then
        ((warnings++))
    fi
    
    # Memory check
    if [ "$mem_used" -gt "$MEM_CRITICAL" ]; then
        ((alerts++))
    elif [ "$mem_used" -gt "$MEM_WARNING" ]; then
        ((warnings++))
    fi
    
    # Disk check
    if [ "$disk_used" -gt "$DISK_CRITICAL" ]; then
        ((alerts++))
    elif [ "$disk_used" -gt "$DISK_WARNING" ]; then
        ((warnings++))
    fi
    
    # Swap check
    if [ "$swap_used" -gt "$SWAP_CRITICAL" ]; then
        ((alerts++))
    elif [ "$swap_used" -gt "$SWAP_WARNING" ]; then
        ((warnings++))
    fi
    
    # Return status
    if [ "$alerts" -gt 0 ]; then
        return 2  # Critical
    elif [ "$warnings" -gt 0 ]; then
        return 1  # Warning
    else
        return 0  # Healthy
    fi
}

# Made with Bob