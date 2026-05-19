#!/bin/bash
# Copyright (c) 2026 e2kd7n. All rights reserved.

# Background Issue Management for Weekly Maintenance
# This script runs the issue priority update in the background so other
# maintenance tasks can proceed without waiting.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

# Directories
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/data/maintenance-logs"
STATUS_FILE="$LOG_DIR/issue-check-status.txt"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Generate timestamp for log file
TIMESTAMP=$(date +"%Y-%m-%d-%H%M%S")
LOG_FILE="$LOG_DIR/issue-check-$TIMESTAMP.log"

# Function to update status file atomically
update_status() {
    local status="$1"
    local message="$2"
    local temp_file=$(mktemp)
    
    cat > "$temp_file" <<EOF
STATUS=$status
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
MESSAGE=$message
LOG_FILE=$LOG_FILE
PID=$$
EOF
    
    mv "$temp_file" "$STATUS_FILE"
}

# Function to log with timestamp
log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "$LOG_FILE"
}

# Trap errors and update status
trap 'update_status "FAILED" "Script failed with error"; exit 1' ERR

# Main execution
main() {
    log "${BLUE}========================================${NC}"
    log "${CYAN}Weekly Maintenance - Issue Management${NC}"
    log "${BLUE}========================================${NC}"
    log ""
    log "Starting background issue check..."
    log "Log file: $LOG_FILE"
    log "Status file: $STATUS_FILE"
    log ""
    
    # Update status to running
    update_status "RUNNING" "Issue management check in progress"
    
    # Change to project root
    cd "$PROJECT_ROOT"
    
    # Run the issue priority update script
    log "${YELLOW}Running update-issue-priorities.sh...${NC}"
    log ""
    
    if "$SCRIPT_DIR/update-issue-priorities.sh" 2>> "$LOG_FILE"; then
        log ""
        log "${GREEN}✅ Issue management check completed successfully${NC}"
        update_status "COMPLETE" "Issue management check finished successfully"
        
        # Show summary
        log ""
        log "${CYAN}Summary:${NC}"
        log "- Check completed at: $(date)"
        log "- Full log available at: $LOG_FILE"
        log "- Updated ISSUE_PRIORITIES.md"
        log ""
        log "${GREEN}You can now review the results with:${NC}"
        log "  ./scripts/maintenance-check-status.sh"
        log "  cat ISSUE_PRIORITIES.md"
        
        exit 0
    else
        log ""
        log "${RED}❌ Issue management check failed${NC}"
        update_status "FAILED" "Issue management check encountered errors"
        
        log ""
        log "${YELLOW}Check the log file for details:${NC}"
        log "  cat $LOG_FILE"
        
        exit 1
    fi
}

# Check if already running
if [ -f "$STATUS_FILE" ]; then
    current_status=$(grep "^STATUS=" "$STATUS_FILE" | cut -d'=' -f2)
    if [ "$current_status" = "RUNNING" ]; then
        current_pid=$(grep "^PID=" "$STATUS_FILE" | cut -d'=' -f2)
        if ps -p "$current_pid" > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  Issue check is already running (PID: $current_pid)${NC}"
            echo -e "Check status with: ./scripts/maintenance-check-status.sh"
            exit 1
        else
            echo -e "${YELLOW}⚠️  Stale status file found, cleaning up...${NC}"
            rm -f "$STATUS_FILE"
        fi
    fi
fi

# Parse command line arguments
BACKGROUND=false
QUIET=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --background|-b)
            BACKGROUND=true
            shift
            ;;
        --quiet|-q)
            QUIET=true
            shift
            ;;
        --help|-h)
            cat <<EOF
Usage: $0 [OPTIONS]

Run issue management check for weekly maintenance.

Options:
  -b, --background    Run in background (detached process)
  -q, --quiet         Suppress output (useful with --background)
  -h, --help          Show this help message

Examples:
  # Run in foreground (default)
  $0

  # Run in background
  $0 --background

  # Run in background quietly
  $0 --background --quiet

  # Check status
  ./scripts/maintenance-check-status.sh

Notes:
  - Creates log file in data/maintenance-logs/
  - Updates status file for monitoring
  - Can be run in separate terminal during maintenance
  - Only one instance can run at a time
EOF
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run in background if requested
if [ "$BACKGROUND" = true ]; then
    if [ "$QUIET" = true ]; then
        nohup "$0" > /dev/null 2>&1 &
    else
        nohup "$0" > "$LOG_FILE.startup" 2>&1 &
    fi
    
    BG_PID=$!
    echo -e "${GREEN}✅ Issue check started in background (PID: $BG_PID)${NC}"
    echo -e "${CYAN}Monitor progress with:${NC}"
    echo -e "  ./scripts/maintenance-check-status.sh"
    echo -e "  tail -f $LOG_FILE"
    exit 0
fi

# Run main function
main

# Made with Bob