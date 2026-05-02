#!/bin/bash
# Interactive Menu System for Meal Planner Scripts
# Detects environment (Pi vs Dev) and shows appropriate options

set -e

# Load common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# Detect environment
detect_environment() {
    # Check if running on Raspberry Pi
    if [ -f /proc/device-tree/model ] && grep -q "Raspberry Pi" /proc/device-tree/model 2>/dev/null; then
        echo "pi"
    # Check for macOS
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "mac"
    # Check for Linux (non-Pi)
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    else
        echo "unknown"
    fi
}

ENV=$(detect_environment)
CONTAINER_CMD=$(detect_container_runtime)

# Clear screen and show header
show_header() {
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${GREEN}🍽️  Meal Planner - Script Management Menu${NC}              ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Show environment info
    case $ENV in
        pi)
            echo -e "${BLUE}📍 Environment:${NC} Raspberry Pi"
            ;;
        mac)
            echo -e "${BLUE}📍 Environment:${NC} macOS (Development)"
            ;;
        linux)
            echo -e "${BLUE}📍 Environment:${NC} Linux (Development)"
            ;;
        *)
            echo -e "${YELLOW}📍 Environment:${NC} Unknown"
            ;;
    esac
    
    if [ -n "$CONTAINER_CMD" ]; then
        echo -e "${BLUE}🐳 Container Runtime:${NC} $CONTAINER_CMD"
    else
        echo -e "${YELLOW}⚠️  No container runtime detected${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}────────────────────────────────────────────────────────────${NC}"
    echo ""
}

# Show quick status
show_quick_status() {
    echo -e "${BLUE}📊 Quick Status:${NC}"
    
    # Disk usage
    local disk_usage=$(get_disk_usage_percent)
    if [ "$disk_usage" -gt "$DISK_CRITICAL" ]; then
        echo -e "   ${RED}💾 Disk: ${disk_usage}% (CRITICAL)${NC}"
    elif [ "$disk_usage" -gt "$DISK_WARNING" ]; then
        echo -e "   ${YELLOW}💾 Disk: ${disk_usage}% (Warning)${NC}"
    else
        echo -e "   ${GREEN}💾 Disk: ${disk_usage}% (Healthy)${NC}"
    fi
    
    # Memory usage (Pi only)
    if [ "$ENV" = "pi" ]; then
        local mem_usage=$(get_memory_usage)
        if [ "$mem_usage" -gt "$MEM_CRITICAL" ]; then
            echo -e "   ${RED}🧠 Memory: ${mem_usage}% (CRITICAL)${NC}"
        elif [ "$mem_usage" -gt "$MEM_WARNING" ]; then
            echo -e "   ${YELLOW}🧠 Memory: ${mem_usage}% (Warning)${NC}"
        else
            echo -e "   ${GREEN}🧠 Memory: ${mem_usage}% (Healthy)${NC}"
        fi
        
        # Temperature
        local temp=$(get_cpu_temp)
        if (( $(echo "$temp > $TEMP_CRITICAL" | bc -l 2>/dev/null || echo 0) )); then
            echo -e "   ${RED}🌡️  Temp: ${temp}°C (CRITICAL)${NC}"
        elif (( $(echo "$temp > $TEMP_WARNING" | bc -l 2>/dev/null || echo 0) )); then
            echo -e "   ${YELLOW}🌡️  Temp: ${temp}°C (Warning)${NC}"
        else
            echo -e "   ${GREEN}🌡️  Temp: ${temp}°C (Normal)${NC}"
        fi
    fi
    
    # Container status
    if [ -n "$CONTAINER_CMD" ]; then
        local running=$($CONTAINER_CMD ps --filter "name=meals-" --format "{{.Names}}" 2>/dev/null | wc -l)
        if [ "$running" -eq 4 ]; then
            echo -e "   ${GREEN}🐳 Containers: $running/4 running${NC}"
        elif [ "$running" -gt 0 ]; then
            echo -e "   ${YELLOW}🐳 Containers: $running/4 running${NC}"
        else
            echo -e "   ${BLUE}🐳 Containers: Not running${NC}"
        fi
    fi
    
    echo ""
}

# Pi-specific menu
show_pi_menu() {
    echo -e "${YELLOW}═══ Raspberry Pi Operations ═══${NC}"
    echo ""
    echo -e "${GREEN}Build & Deploy:${NC}"
    echo "  1) Build images on Pi"
    echo "  2) Build frontend only"
    echo "  3) Deploy/Start containers"
    echo "  4) Stop containers"
    echo "  5) Restart containers"
    echo ""
    echo -e "${GREEN}Maintenance:${NC}"
    echo "  6) Health check"
    echo "  7) Full diagnostics"
    echo "  8) Cleanup Pi"
    echo "  9) Pre-build cleanup"
    echo " 10) Journal cleanup (requires sudo)"
    echo ""
    echo -e "${GREEN}Database:${NC}"
    echo " 11) Backup database"
    echo " 12) Restore database"
    echo ""
    echo -e "${BLUE}Other:${NC}"
    echo "  0) Exit"
    echo ""
}

# Dev machine menu
show_dev_menu() {
    echo -e "${YELLOW}═══ Development Machine Operations ═══${NC}"
    echo ""
    echo -e "${GREEN}Build & Deploy:${NC}"
    echo "  1) Build for Pi (cross-compile)"
    echo "  2) Build locally"
    echo "  3) Run locally"
    echo "  4) Stop local containers"
    echo ""
    echo -e "${GREEN}Maintenance:${NC}"
    echo "  5) Cleanup dev machine"
    echo "  6) Run E2E tests"
    echo ""
    echo -e "${GREEN}Pi Management:${NC}"
    echo "  7) Load images to Pi"
    echo "  8) Deploy to Pi"
    echo "  9) Check Pi health (SSH)"
    echo ""
    echo -e "${BLUE}Other:${NC}"
    echo "  0) Exit"
    echo ""
}

# Execute Pi command
execute_pi_command() {
    case $1 in
        1)
            echo -e "${BLUE}Building images on Pi...${NC}"
            "$SCRIPT_DIR/build-on-pi.sh"
            ;;
        2)
            echo -e "${BLUE}Building frontend only...${NC}"
            "$SCRIPT_DIR/build-on-pi-frontend-only.sh"
            ;;
        3)
            echo -e "${BLUE}Deploying containers...${NC}"
            "$SCRIPT_DIR/pi-run.sh"
            ;;
        4)
            echo -e "${BLUE}Stopping containers...${NC}"
            "$SCRIPT_DIR/pi-stop.sh"
            ;;
        5)
            echo -e "${BLUE}Restarting containers...${NC}"
            "$SCRIPT_DIR/pi-bounce.sh"
            ;;
        6)
            echo -e "${BLUE}Running health check...${NC}"
            "$SCRIPT_DIR/pi-health-check.sh"
            ;;
        7)
            echo -e "${BLUE}Running full diagnostics...${NC}"
            "$SCRIPT_DIR/pi-diagnostics.sh"
            ;;
        8)
            echo -e "${BLUE}Cleaning up Pi...${NC}"
            "$SCRIPT_DIR/cleanup-pi.sh"
            ;;
        9)
            echo -e "${BLUE}Running pre-build cleanup...${NC}"
            "$SCRIPT_DIR/pi-pre-build-cleanup.sh"
            ;;
        10)
            echo -e "${BLUE}Cleaning journal logs...${NC}"
            sudo "$SCRIPT_DIR/pi-journal-cleanup.sh"
            ;;
        11)
            echo -e "${BLUE}Backing up database...${NC}"
            "$SCRIPT_DIR/backup-database.sh"
            ;;
        12)
            echo -e "${BLUE}Restoring database...${NC}"
            "$SCRIPT_DIR/restore-database.sh"
            ;;
        0)
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            ;;
    esac
}

# Execute dev command
execute_dev_command() {
    case $1 in
        1)
            echo -e "${BLUE}Building for Pi...${NC}"
            "$SCRIPT_DIR/build-for-pi.sh"
            ;;
        2)
            echo -e "${BLUE}Building locally...${NC}"
            "$SCRIPT_DIR/local-run.sh"
            ;;
        3)
            echo -e "${BLUE}Running locally...${NC}"
            "$SCRIPT_DIR/local-run.sh"
            ;;
        4)
            echo -e "${BLUE}Stopping local containers...${NC}"
            "$SCRIPT_DIR/local-stop.sh"
            ;;
        5)
            echo -e "${BLUE}Cleaning up dev machine...${NC}"
            "$SCRIPT_DIR/cleanup-dev-machine.sh"
            ;;
        6)
            echo -e "${BLUE}Running E2E tests...${NC}"
            "$SCRIPT_DIR/run-e2e-tests.sh"
            ;;
        7)
            echo -e "${BLUE}Loading images to Pi...${NC}"
            "$SCRIPT_DIR/load-pi-images.sh"
            ;;
        8)
            echo -e "${BLUE}Deploying to Pi...${NC}"
            "$SCRIPT_DIR/deploy-podman.sh"
            ;;
        9)
            echo -e "${BLUE}Checking Pi health via SSH...${NC}"
            echo -e "${YELLOW}Enter Pi hostname/IP:${NC}"
            read -r pi_host
            ssh "$pi_host" "cd ~/mealplanner && ./scripts/pi-health-check.sh"
            ;;
        0)
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            ;;
    esac
}

# Main loop
main() {
    while true; do
        show_header
        show_quick_status
        
        if [ "$ENV" = "pi" ]; then
            show_pi_menu
        else
            show_dev_menu
        fi
        
        echo -ne "${CYAN}Select option:${NC} "
        read -r choice
        echo ""
        
        if [ "$ENV" = "pi" ]; then
            execute_pi_command "$choice"
        else
            execute_dev_command "$choice"
        fi
        
        echo ""
        echo -e "${YELLOW}Press Enter to continue...${NC}"
        read -r
    done
}

# Run main
main

# Made with Bob