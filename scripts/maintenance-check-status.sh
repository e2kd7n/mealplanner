#!/bin/bash
# Copyright (c) 2026 e2kd7n. All rights reserved.

# Check Status of Background Maintenance Tasks
# Monitors the status of background issue management check

set -euo pipefail

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/data/maintenance-logs"
STATUS_FILE="$LOG_DIR/issue-check-status.txt"

# Parse command line arguments
WATCH=false
TAIL_LOG=false
SHOW_SUMMARY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --watch|-w)
            WATCH=true
            shift
            ;;
        --tail|-t)
            TAIL_LOG=true
            shift
            ;;
        --summary|-s)
            SHOW_SUMMARY=true
            shift
            ;;
        --help|-h)
            cat <<EOF
Usage: $0 [OPTIONS]

Check the status of background maintenance tasks.

Options:
  -w, --watch      Watch status continuously (updates every 2 seconds)
  -t, --tail       Tail the log file (follow mode)
  -s, --summary    Show summary of completed check
  -h, --help       Show this help message

Examples:
  # Check current status
  $0

  # Watch status continuously
  $0 --watch

  # Follow log output
  $0 --tail

  # Show summary after completion
  $0 --summary

Exit Codes:
  0 - Task completed successfully
  1 - Task failed or error occurred
  2 - Task still running
  3 - No task found

Notes:
  - Status file location: data/maintenance-logs/issue-check-status.txt
  - Log files location: data/maintenance-logs/issue-check-*.log
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

# Function to display status
display_status() {
    if [ ! -f "$STATUS_FILE" ]; then
        echo -e "${YELLOW}⚠️  No background task status found${NC}"
        echo ""
        echo "Start a background check with:"
        echo "  ./scripts/maintenance-issue-check.sh --background"
        return 3
    fi
    
    # Read status file
    local status=$(grep "^STATUS=" "$STATUS_FILE" | cut -d'=' -f2)
    local timestamp=$(grep "^TIMESTAMP=" "$STATUS_FILE" | cut -d'=' -f2)
    local message=$(grep "^MESSAGE=" "$STATUS_FILE" | cut -d'=' -f2)
    local log_file=$(grep "^LOG_FILE=" "$STATUS_FILE" | cut -d'=' -f2)
    local pid=$(grep "^PID=" "$STATUS_FILE" | cut -d'=' -f2 2>/dev/null || echo "unknown")
    
    # Display header
    echo -e "${BLUE}========================================${NC}"
    echo -e "${CYAN}Background Task Status${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    # Display status with appropriate color
    case "$status" in
        RUNNING)
            echo -e "Status:    ${YELLOW}⏳ RUNNING${NC}"
            if [ "$pid" != "unknown" ] && ps -p "$pid" > /dev/null 2>&1; then
                echo -e "Process:   ${GREEN}Active (PID: $pid)${NC}"
            else
                echo -e "Process:   ${RED}Not found (may have completed)${NC}"
            fi
            ;;
        COMPLETE)
            echo -e "Status:    ${GREEN}✅ COMPLETE${NC}"
            ;;
        FAILED)
            echo -e "Status:    ${RED}❌ FAILED${NC}"
            ;;
        *)
            echo -e "Status:    ${MAGENTA}Unknown: $status${NC}"
            ;;
    esac
    
    echo -e "Updated:   $timestamp"
    echo -e "Message:   $message"
    echo ""
    
    # Show log file info
    if [ -f "$log_file" ]; then
        local log_size=$(du -h "$log_file" | cut -f1)
        local log_lines=$(wc -l < "$log_file" | tr -d ' ')
        echo -e "${CYAN}Log File:${NC}"
        echo -e "  Path:  $log_file"
        echo -e "  Size:  $log_size"
        echo -e "  Lines: $log_lines"
        echo ""
        
        # Show last few lines if complete or failed
        if [ "$status" = "COMPLETE" ] || [ "$status" = "FAILED" ]; then
            echo -e "${CYAN}Last 10 lines:${NC}"
            tail -10 "$log_file" | sed 's/^/  /'
            echo ""
        fi
    else
        echo -e "${YELLOW}Log file not found: $log_file${NC}"
        echo ""
    fi
    
    # Show available actions
    echo -e "${CYAN}Available Actions:${NC}"
    case "$status" in
        RUNNING)
            echo "  ./scripts/maintenance-check-status.sh --watch    # Watch progress"
            echo "  ./scripts/maintenance-check-status.sh --tail     # Follow log"
            echo "  tail -f $log_file                                # Direct log follow"
            return 2
            ;;
        COMPLETE)
            echo "  cat ISSUE_PRIORITIES.md                          # View results"
            echo "  cat $log_file                                    # View full log"
            echo "  ./scripts/maintenance-check-status.sh --summary  # Show summary"
            return 0
            ;;
        FAILED)
            echo "  cat $log_file                                    # View error log"
            echo "  ./scripts/maintenance-issue-check.sh             # Retry"
            return 1
            ;;
        *)
            return 1
            ;;
    esac
}

# Function to show summary
show_summary() {
    if [ ! -f "$STATUS_FILE" ]; then
        echo -e "${YELLOW}⚠️  No status file found${NC}"
        return 3
    fi
    
    local status=$(grep "^STATUS=" "$STATUS_FILE" | cut -d'=' -f2)
    
    if [ "$status" != "COMPLETE" ]; then
        echo -e "${YELLOW}⚠️  Task not yet complete (status: $status)${NC}"
        return 2
    fi
    
    echo -e "${BLUE}========================================${NC}"
    echo -e "${CYAN}Issue Management Summary${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    # Check if ISSUE_PRIORITIES.md exists and show summary
    if [ -f "$PROJECT_ROOT/ISSUE_PRIORITIES.md" ]; then
        echo -e "${GREEN}✅ ISSUE_PRIORITIES.md updated${NC}"
        echo ""
        
        # Extract priority counts
        local p0_count=$(grep -c "^- #" "$PROJECT_ROOT/ISSUE_PRIORITIES.md" | grep -A 20 "P0 - CRITICAL" || echo "0")
        local p1_count=$(grep -c "^- #" "$PROJECT_ROOT/ISSUE_PRIORITIES.md" | grep -A 20 "P1 - HIGH" || echo "0")
        local p2_count=$(grep -c "^- #" "$PROJECT_ROOT/ISSUE_PRIORITIES.md" | grep -A 20 "P2 - MEDIUM" || echo "0")
        local p3_count=$(grep -c "^- #" "$PROJECT_ROOT/ISSUE_PRIORITIES.md" | grep -A 20 "P3 - LOW" || echo "0")
        
        echo -e "${CYAN}Issue Counts by Priority:${NC}"
        echo "  P0 (Critical): Check ISSUE_PRIORITIES.md"
        echo "  P1 (High):     Check ISSUE_PRIORITIES.md"
        echo "  P2 (Medium):   Check ISSUE_PRIORITIES.md"
        echo "  P3 (Low):      Check ISSUE_PRIORITIES.md"
        echo ""
        
        echo -e "${CYAN}View full report:${NC}"
        echo "  cat ISSUE_PRIORITIES.md"
        echo "  less ISSUE_PRIORITIES.md"
    else
        echo -e "${YELLOW}⚠️  ISSUE_PRIORITIES.md not found${NC}"
    fi
    
    echo ""
}

# Main execution
main() {
    # Handle different modes
    if [ "$TAIL_LOG" = true ]; then
        if [ ! -f "$STATUS_FILE" ]; then
            echo -e "${YELLOW}⚠️  No status file found${NC}"
            exit 3
        fi
        
        local log_file=$(grep "^LOG_FILE=" "$STATUS_FILE" | cut -d'=' -f2)
        
        if [ ! -f "$log_file" ]; then
            echo -e "${RED}❌ Log file not found: $log_file${NC}"
            exit 1
        fi
        
        echo -e "${CYAN}Following log file: $log_file${NC}"
        echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
        echo ""
        tail -f "$log_file"
        exit 0
    fi
    
    if [ "$SHOW_SUMMARY" = true ]; then
        show_summary
        exit $?
    fi
    
    if [ "$WATCH" = true ]; then
        echo -e "${CYAN}Watching status (updates every 2 seconds)${NC}"
        echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
        echo ""
        
        while true; do
            clear
            display_status
            local exit_code=$?
            
            # Stop watching if task is complete or failed
            if [ $exit_code -eq 0 ] || [ $exit_code -eq 1 ]; then
                echo ""
                echo -e "${GREEN}Task finished, stopping watch mode${NC}"
                exit $exit_code
            fi
            
            sleep 2
        done
    fi
    
    # Default: show status once
    display_status
    exit $?
}

# Run main function
main

# Made with Bob