#!/bin/bash
/** Copyright (c) 2026 e2kd7n. All rights reserved. */

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
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root
cd "$PROJECT_ROOT"

# Send notification using helper script
"$SCRIPT_DIR/send-notification.sh" \
    "default" \
    "Weekly Maintenance Due" \
    "Time to run weekly maintenance checklist. Estimated: 15-25 minutes. See: docs/WEEKLY_MAINTENANCE.md" \
    "clipboard,calendar"

echo "Maintenance reminder sent"

