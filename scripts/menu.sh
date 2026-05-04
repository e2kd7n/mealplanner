#!/bin/bash
# Interactive Menu System for Meal Planner Scripts
# Detects environment (Pi vs Dev) and shows appropriate options

set -e

# Load common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utilities.sh"

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

# Check deployment mode
check_deployment_mode() {
    # Check for local dev mode (Vite on 5173)
    if command -v lsof &> /dev/null && lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "local-dev"
        return
    fi
    
    # Check for container mode (nginx on 8080)
    if command -v lsof &> /dev/null && lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "container"
        return
    fi
    
    # Fallback to netstat/ss for systems without lsof
    if command -v netstat &> /dev/null; then
        if netstat -tuln 2>/dev/null | grep -q ":5173 "; then
            echo "local-dev"
            return
        elif netstat -tuln 2>/dev/null | grep -q ":8080 "; then
            echo "container"
            return
        fi
    fi
    
    echo "none"
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
    
    # Deployment mode status
    local mode=$(check_deployment_mode)
    case $mode in
        local-dev)
            echo -e "   ${GREEN}🚀 Mode: Local Development (Port 5173)${NC}"
            echo -e "   ${BLUE}   → Hot reload enabled, fast iteration${NC}"
            ;;
        container)
            echo -e "   ${GREEN}🐳 Mode: Container (Port 8080)${NC}"
            echo -e "   ${BLUE}   → Production-like environment${NC}"
            ;;
        none)
            echo -e "   ${YELLOW}⚠️  Mode: Not running${NC}"
            ;;
    esac
    
    # Container status (if applicable)
    if [ -n "$CONTAINER_CMD" ] && [ "$mode" = "container" ]; then
        local running=$($CONTAINER_CMD ps --filter "name=meals-" --format "{{.Names}}" 2>/dev/null | wc -l)
        if [ "$running" -eq 4 ]; then
            echo -e "   ${GREEN}   Containers: $running/4 running${NC}"
        elif [ "$running" -gt 0 ]; then
            echo -e "   ${YELLOW}   Containers: $running/4 running (incomplete)${NC}"
        fi
    fi
    
    echo ""
}

# Pi-specific menu
show_pi_menu() {
    echo -e "${YELLOW}═══ Raspberry Pi Operations ═══${NC}"
    echo ""
    
    local current_mode=$(check_deployment_mode)
    echo -e "${GREEN}🚀 Deployment:${NC}"
    echo "  1) Deploy/Start containers"
    if [ "$current_mode" = "container" ]; then
        echo -e "     ${GREEN}✓ Currently running${NC}"
    fi
    echo "  2) Stop containers"
    echo "  3) Restart containers"
    echo "  4) Check deployment mode"
    echo ""
    
    echo -e "${GREEN}🔨 Build (On Pi):${NC}"
    echo "  5) Build all images"
    echo "  6) Build frontend only"
    echo "  7) Load pre-built images"
    echo ""
    
    echo -e "${GREEN}🔧 Maintenance:${NC}"
    echo "  8) Health check"
    echo "  9) Full diagnostics"
    echo " 10) Cleanup Pi"
    echo " 11) Pre-build cleanup"
    echo " 12) Journal cleanup (sudo)"
    echo ""
    
    echo -e "${GREEN}💾 Database:${NC}"
    echo " 13) Backup database"
    echo " 14) Restore database"
    echo " 15) Safe migration"
    echo ""
    
    echo -e "${BLUE}Other:${NC}"
    echo "  0) Exit"
    echo ""
}

# Dev machine menu
show_dev_menu() {
    echo -e "${YELLOW}═══ Development Machine Operations ═══${NC}"
    echo ""
    
    # Show deployment mode selection with guidance
    local current_mode=$(check_deployment_mode)
    echo -e "${GREEN}🚀 Local Deployment:${NC}"
    echo "  1) Local Dev Mode (Port 5173)"
    echo -e "     ${BLUE}→ For: Active development, hot reload, debugging${NC}"
    echo -e "     ${BLUE}→ Resources: ~2GB RAM, Node.js required${NC}"
    if [ "$current_mode" = "local-dev" ]; then
        echo -e "     ${GREEN}✓ Currently running${NC}"
    fi
    echo ""
    echo "  2) Container Mode (Port 8080)"
    echo -e "     ${BLUE}→ For: Production testing, deployment prep${NC}"
    echo -e "     ${BLUE}→ Resources: ~3GB RAM, Docker/Podman required${NC}"
    if [ "$current_mode" = "container" ]; then
        echo -e "     ${GREEN}✓ Currently running${NC}"
    fi
    echo ""
    echo "  3) Stop all services"
    echo "  4) Restart services (bounce)"
    echo "  5) Check deployment mode"
    echo ""
    
    echo -e "${GREEN}🔨 Build for Pi:${NC}"
    echo "  6) Build images for Pi (cross-compile)"
    echo "  7) Transfer images to Pi"
    echo ""
    
    echo -e "${GREEN}🚀 Pi Deployment (SSH):${NC}"
    echo "  8) Deploy to Pi"
    echo "  9) Check Pi health"
    echo " 10) View Pi logs"
    echo ""
    
    echo -e "${GREEN}🧪 Testing:${NC}"
    echo " 11) Run E2E tests"
    echo " 12) Run E2E tests (UI mode)"
    echo ""
    
    echo -e "${GREEN}💾 Database:${NC}"
    echo " 13) Backup database (local)"
    echo " 14) Restore database (local)"
    echo ""
    
    echo -e "${GREEN}🔧 Maintenance:${NC}"
    echo " 15) Cleanup dev machine"
    echo " 16) Generate secrets"
    echo " 17) First-time setup"
    echo ""
    
    echo -e "${BLUE}Other:${NC}"
    echo "  0) Exit"
    echo ""
}

# Execute Pi command
execute_pi_command() {
    case $1 in
        1)
            echo -e "${BLUE}Deploying containers...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/pi-run.sh"
            ;;
        2)
            echo -e "${BLUE}Stopping containers...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/pi-stop.sh"
            ;;
        3)
            echo -e "${BLUE}Restarting containers...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/pi-bounce.sh"
            ;;
        4)
            echo -e "${BLUE}Checking deployment mode...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/check-deployment-mode.sh"
            ;;
        5)
            echo -e "${BLUE}Building all images on Pi...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/build-on-pi.sh"
            ;;
        6)
            echo -e "${BLUE}Building frontend only...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/build-on-pi-frontend-only.sh"
            ;;
        7)
            echo -e "${BLUE}Loading pre-built images...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/load-pi-images.sh"
            ;;
        8)
            echo -e "${BLUE}Running health check...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/pi-health-check.sh"
            ;;
        9)
            echo -e "${BLUE}Running full diagnostics...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/pi-diagnostics.sh"
            ;;
        10)
            echo -e "${BLUE}Cleaning up Pi...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/cleanup-pi.sh"
            ;;
        11)
            echo -e "${BLUE}Running pre-build cleanup...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/pi-pre-build-cleanup.sh"
            ;;
        12)
            echo -e "${BLUE}Cleaning journal logs...${NC}"
            CALLED_FROM_MENU=1 sudo "$SCRIPT_DIR/pi-journal-cleanup.sh"
            ;;
        13)
            echo -e "${BLUE}Backing up database...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/backup-database.sh"
            ;;
        14)
            echo -e "${BLUE}Restoring database...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/restore-database.sh"
            ;;
        15)
            echo -e "${BLUE}Running safe migration...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/safe-migrate.sh"
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
            echo -e "${BLUE}Starting Local Development Mode...${NC}"
            echo -e "${YELLOW}This will start services on port 5173 with hot reload${NC}"
            echo -e "${BLUE}Resources: ~2GB RAM, Node.js + dependencies${NC}"
            echo ""
            # Stop container mode if running
            local current_mode=$(check_deployment_mode)
            if [ "$current_mode" = "container" ]; then
                echo -e "${YELLOW}Stopping container mode first...${NC}"
                CALLED_FROM_MENU=1 "$SCRIPT_DIR/local-stop.sh" 2>/dev/null || true
                if [ -n "$CONTAINER_CMD" ]; then
                    $CONTAINER_CMD stop meals-postgres meals-backend meals-frontend meals-nginx 2>/dev/null || true
                fi
                sleep 2
            fi
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/local-run.sh"
            ;;
        2)
            echo -e "${BLUE}Starting Container Mode...${NC}"
            echo -e "${YELLOW}This will start production-like containers on port 8080${NC}"
            echo -e "${BLUE}Resources: ~3GB RAM, Docker/Podman required${NC}"
            echo ""
            # Stop local dev mode if running
            local current_mode=$(check_deployment_mode)
            if [ "$current_mode" = "local-dev" ]; then
                echo -e "${YELLOW}Stopping local dev mode first...${NC}"
                CALLED_FROM_MENU=1 "$SCRIPT_DIR/local-stop.sh" 2>/dev/null || true
                sleep 2
            fi
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/deploy-podman.sh"
            ;;
        3)
            echo -e "${BLUE}Stopping all services...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/local-stop.sh" 2>/dev/null || true
            if [ -n "$CONTAINER_CMD" ]; then
                $CONTAINER_CMD stop meals-postgres meals-backend meals-frontend meals-nginx 2>/dev/null || true
            fi
            echo -e "${GREEN}✓ All services stopped${NC}"
            ;;
        4)
            echo -e "${BLUE}Restarting services...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/local-bounce.sh"
            ;;
        5)
            echo -e "${BLUE}Checking deployment mode...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/check-deployment-mode.sh"
            ;;
        6)
            echo -e "${BLUE}Building for Pi (cross-compile)...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/build-for-pi.sh"
            ;;
        7)
            echo -e "${BLUE}Transferring images to Pi...${NC}"
            echo -e "${YELLOW}Enter Pi hostname/IP (e.g., raspberrypi.local):${NC}"
            read -r pi_host
            if [ -n "$pi_host" ]; then
                echo -e "${BLUE}Transferring to $pi_host...${NC}"
                rsync -avz --progress pi-images/ "$pi_host:~/mealplanner/pi-images/" || \
                scp pi-images/*.tar "$pi_host:~/mealplanner/pi-images/"
            else
                echo -e "${RED}No hostname provided${NC}"
            fi
            ;;
        8)
            echo -e "${BLUE}Deploying to Pi via SSH...${NC}"
            echo -e "${YELLOW}Enter Pi hostname/IP (e.g., raspberrypi.local):${NC}"
            read -r pi_host
            if [ -n "$pi_host" ]; then
                echo -e "${BLUE}Deploying to $pi_host...${NC}"
                ssh "$pi_host" "cd ~/mealplanner && CALLED_FROM_MENU=1 ./scripts/pi-run.sh"
            else
                echo -e "${RED}No hostname provided${NC}"
            fi
            ;;
        9)
            echo -e "${BLUE}Checking Pi health via SSH...${NC}"
            echo -e "${YELLOW}Enter Pi hostname/IP (e.g., raspberrypi.local):${NC}"
            read -r pi_host
            if [ -n "$pi_host" ]; then
                ssh "$pi_host" "cd ~/mealplanner && CALLED_FROM_MENU=1 ./scripts/pi-health-check.sh"
            else
                echo -e "${RED}No hostname provided${NC}"
            fi
            ;;
        10)
            echo -e "${BLUE}Viewing Pi logs via SSH...${NC}"
            echo -e "${YELLOW}Enter Pi hostname/IP (e.g., raspberrypi.local):${NC}"
            read -r pi_host
            if [ -n "$pi_host" ]; then
                ssh "$pi_host" "cd ~/mealplanner && podman-compose -f podman-compose.pi.yml logs -f"
            else
                echo -e "${RED}No hostname provided${NC}"
            fi
            ;;
        11)
            echo -e "${BLUE}Running E2E tests...${NC}"
            cd frontend && npm run test:e2e 2>/dev/null || echo -e "${YELLOW}E2E tests not configured${NC}"
            cd ..
            ;;
        12)
            echo -e "${BLUE}Running E2E tests (UI mode)...${NC}"
            cd frontend && npm run test:e2e:ui 2>/dev/null || echo -e "${YELLOW}E2E tests not configured${NC}"
            cd ..
            ;;
        13)
            echo -e "${BLUE}Backing up database (local)...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/backup-database.sh"
            ;;
        14)
            echo -e "${BLUE}Restoring database (local)...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/database-restore-local.sh"
            ;;
        15)
            echo -e "${BLUE}Cleaning up dev machine...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/cleanup-dev-machine.sh" 2>/dev/null || echo -e "${YELLOW}Cleanup script not found${NC}"
            ;;
        16)
            echo -e "${BLUE}Generating secrets...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/generate-secrets.sh"
            ;;
        17)
            echo -e "${BLUE}Running first-time setup...${NC}"
            CALLED_FROM_MENU=1 "$SCRIPT_DIR/first-time-setup.sh"
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