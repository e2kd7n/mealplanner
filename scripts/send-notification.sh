#!/bin/bash
/** Copyright (c) 2026 e2kd7n. All rights reserved. */

# Send Notification Helper Script
# 
# Usage: ./scripts/send-notification.sh <priority> <title> <message> [tags]
# 
# Priority: urgent, high, default, low, min
# Tags: comma-separated emoji tags (e.g., "rotating_light,warning")
#
# Examples:
#   ./scripts/send-notification.sh urgent "Backup Failed" "Database backup failed with error code 1" "rotating_light,floppy_disk"
#   ./scripts/send-notification.sh default "Backup Success" "Backup completed: 125MB" "white_check_mark,floppy_disk"

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
NTFY_ENABLED="${NTFY_ENABLED:-false}"
NTFY_SERVER="${NTFY_SERVER_URL:-https://ntfy.sh}"
NTFY_TOPIC="${NTFY_TOPIC:-mealplanner}"
NTFY_AUTH_TOKEN="${NTFY_AUTH_TOKEN:-}"

# Check if notifications are enabled
if [ "$NTFY_ENABLED" != "true" ]; then
    echo "Notifications disabled (NTFY_ENABLED=$NTFY_ENABLED)"
    exit 0
fi

# Parse arguments
PRIORITY="${1:-default}"
TITLE="${2:-Notification}"
MESSAGE="${3:-}"
TAGS="${4:-information_source}"

if [ -z "$MESSAGE" ]; then
    echo "Usage: $0 <priority> <title> <message> [tags]"
    echo "Priority: urgent, high, default, low, min"
    exit 1
fi

# Map priority to ntfy numeric value
case "$PRIORITY" in
    urgent)
        PRIORITY_NUM=5
        ;;
    high)
        PRIORITY_NUM=4
        ;;
    default)
        PRIORITY_NUM=3
        ;;
    low)
        PRIORITY_NUM=2
        ;;
    min)
        PRIORITY_NUM=1
        ;;
    *)
        echo "Invalid priority: $PRIORITY"
        echo "Valid priorities: urgent, high, default, low, min"
        exit 1
        ;;
esac

CURL_ARGS=(-s)

if [ -n "$NTFY_AUTH_TOKEN" ]; then
    CURL_ARGS+=(-H "Authorization: Bearer $NTFY_AUTH_TOKEN")
fi

CURL_ARGS+=(
    -H "Title: $TITLE"
    -H "Priority: $PRIORITY_NUM"
    -H "Tags: $TAGS"
    -d "$MESSAGE"
    "$NTFY_SERVER/$NTFY_TOPIC"
)

echo "Sending notification: $TITLE ($PRIORITY)"
if curl "${CURL_ARGS[@]}"; then
    echo ""
    echo "Notification sent successfully"
else
    echo "Failed to send notification"
    exit 1
fi

