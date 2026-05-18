#!/bin/bash
# Common utility functions for Pi scripts
# Source this file in other scripts: source "$(dirname "$0")/utilities.sh"

# Colors for output
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export CYAN='\033[0;36m'
export NC='\033[0m'
export BOLD='\033[1m'
export DIM='\033[2m'

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

# Detect the current OS: mac | wsl | pi | linux | windows | unknown
detect_os() {
    case "$(uname -s)" in
        Darwin*)  echo "mac" ;;
        Linux*)
            if grep -qi microsoft /proc/version 2>/dev/null; then
                echo "wsl"
            elif [ -f /proc/device-tree/model ] && grep -q "Raspberry Pi" /proc/device-tree/model 2>/dev/null; then
                echo "pi"
            else
                echo "linux"
            fi
            ;;
        MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
        *) echo "unknown" ;;
    esac
}

# Extract the compiled React frontend from the backend image into ./data/frontend-dist/.
# Nginx serves these static files directly on the Pi — there is no frontend container.
# Uses podman create/cp/rm so the container never runs and no volume mount is needed.
# Usage: extract_frontend_from_image [image_name]
extract_frontend_from_image() {
    local image="${1:-meals-backend:latest}"
    mkdir -p ./data/frontend-dist
    rm -rf ./data/frontend-dist/*
    local cid
    cid=$(podman create "$image")
    podman cp "$cid:/app/public/." ./data/frontend-dist/
    podman rm "$cid" >/dev/null
    echo -e "${GREEN}✓ Extracted $(ls ./data/frontend-dist | wc -l) files → ./data/frontend-dist/${NC}"
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
    local expected=4  # postgres, redis, backend, nginx
    
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

# ── Progress & Status UI ─────────────────────────────────────────────────────
#
#  section "Title" [emoji]          — recipe-card section header
#  steps_init <n>                   — start a numbered step sequence
#  step "description"               — print next step (auto-increments)
#  start_spinner "message"          — animated braille spinner in background
#  stop_spinner [ok|fail]           — stop spinner, print ✓ or ✗
#  progress_bar <n> <total> [label] — inline progress bar (call in a loop)
#  timer_start / timer_end          — elapsed-time bookends
#  wait_for "desc" <timeout> <interval> <cmd> [args...]
#                                   — spin + poll until cmd succeeds or times out
# ─────────────────────────────────────────────────────────────────────────────

# Print a recipe-card style section header with an underline rule.
# Usage: section "Heading" [emoji]
section() {
    local title="$1"
    local emoji="${2:-🍽️}"
    echo ""
    echo -e "${CYAN}  ${emoji}  ${BOLD}${title}${NC}"
    echo -e "${CYAN}  ──────────────────────────────────────────────${NC}"
}

# Initialise a numbered step counter.
# Usage: steps_init <total>
_STEP_CURRENT=0
_STEP_TOTAL=0
steps_init() {
    _STEP_TOTAL="${1:-0}"
    _STEP_CURRENT=0
}

# Print the next numbered step.
# Usage: step "Description"
step() {
    _STEP_CURRENT=$(( _STEP_CURRENT + 1 ))
    local label="$1"
    if [[ "$_STEP_TOTAL" -gt 0 ]]; then
        echo -e "  ${CYAN}▸${NC} ${BOLD}[$_STEP_CURRENT/$_STEP_TOTAL]${NC} $label"
    else
        echo -e "  ${CYAN}▸${NC} $label"
    fi
}

# Start an animated braille spinner in the background.
# Usage: start_spinner "message"
_SPINNER_PID=""
_SPINNER_MSG=""
_SPINNER_ACTIVE=0
start_spinner() {
    [[ "${_SPINNER_ACTIVE:-0}" == "1" ]] && return
    local msg="${1:-Working...}"
    _SPINNER_MSG="$msg"
    _SPINNER_ACTIVE=1
    (
        local i=0
        local frames=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
        while true; do
            printf "\r  \033[0;36m%s\033[0m  %s " "${frames[$i]}" "$msg"
            i=$(( (i + 1) % 10 ))
            sleep 0.1
        done
    ) &
    _SPINNER_PID=$!
    disown "$_SPINNER_PID" 2>/dev/null || true
}

# Stop the spinner and print ✓ (ok) or ✗ (fail) on the cleared line.
# Usage: stop_spinner [ok|fail]
stop_spinner() {
    local status="${1:-ok}"
    _SPINNER_ACTIVE=0
    if [[ -n "${_SPINNER_PID:-}" ]]; then
        kill "$_SPINNER_PID" 2>/dev/null || true
        _SPINNER_PID=""
    fi
    printf "\r\033[2K"
    if [[ "$status" == "fail" ]]; then
        echo -e "  ${RED}✗${NC}  ${_SPINNER_MSG}"
    else
        echo -e "  ${GREEN}✓${NC}  ${_SPINNER_MSG}"
    fi
}

# Render an inline progress bar. Call once per iteration inside a loop.
# Prints a newline automatically on the final step.
# Usage: progress_bar <current> <total> [label]
progress_bar() {
    local current=$1
    local total=$2
    local label="${3:-}"
    local width=28
    local filled=$(( total > 0 ? current * width / total : 0 ))
    local empty=$(( width - filled ))
    local bar="" i
    for (( i=0; i<filled; i++ )); do bar+="█"; done
    for (( i=0; i<empty; i++ )); do bar+="░"; done
    local pct=$(( total > 0 ? current * 100 / total : 0 ))
    printf "\r  %-22s ${GREEN}%s${NC} %3d%%" "${label}" "$bar" "$pct"
    [[ "$current" -ge "$total" ]] && echo ""
}

# Mark the start of a timed section. Pair with timer_end.
_TIMER_START=0
timer_start() { _TIMER_START=$SECONDS; }

# Print elapsed time since timer_start.
timer_end() {
    local elapsed=$(( SECONDS - _TIMER_START ))
    local mins=$(( elapsed / 60 ))
    local secs=$(( elapsed % 60 ))
    if [[ $mins -gt 0 ]]; then
        echo -e "  ${DIM}⏱  Done in ${mins}m ${secs}s${NC}"
    else
        echo -e "  ${DIM}⏱  Done in ${secs}s${NC}"
    fi
}

# Poll an external command until it succeeds or the timeout expires,
# showing an animated spinner throughout.
# Usage: wait_for "description" <timeout_sec> <interval_sec> <command> [args...]
# Returns 0 on success, 1 on timeout.
wait_for() {
    local desc="$1"
    local timeout="$2"
    local interval="$3"
    shift 3
    local waited=0
    start_spinner "$desc"
    while [[ $waited -lt $timeout ]]; do
        if "$@" &>/dev/null 2>&1; then
            stop_spinner ok
            return 0
        fi
        sleep "$interval"
        waited=$(( waited + interval ))
    done
    stop_spinner fail
    return 1
}

# Made with Bob