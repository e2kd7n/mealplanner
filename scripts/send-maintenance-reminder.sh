#!/bin/bash
# Copyright (c) 2026 e2kd7n. All rights reserved.

# Weekly Maintenance Reminder Script
#
# Sends a notification reminder to run the weekly maintenance checklist.
# Intended to be run via cron job every Monday at 9 AM.
#
# Crontab entry:
#   0 9 * * 1 /path/to/mealplanner/scripts/send-maintenance-reminder.sh
#
# Or use with systemd timer for more control.

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root
cd "$PROJECT_ROOT"

section "Maintenance Reminder" "🔔"

# Send notification using helper script
start_spinner "Sending weekly maintenance reminder"
if "$SCRIPT_DIR/send-notification.sh" \
    "default" \
    "Weekly Maintenance Due" \
    "Time to run weekly maintenance checklist. Estimated: 15-25 minutes. See: docs/WEEKLY_MAINTENANCE.md" \
    "clipboard,calendar" > /dev/null; then
    stop_spinner ok
else
    stop_spinner fail
    exit 1
fi

echo -e "  ${GREEN}✓${NC}  Maintenance reminder sent"
