#!/bin/bash
/** Copyright (c) 2026 e2kd7n. All rights reserved. */

# Test Notification System
#
# This script tests the notification system by sending test notifications
# at different priority levels.
#
# Usage: ./scripts/test-notifications.sh

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root
cd "$PROJECT_ROOT"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if notifications are enabled
if [ "$NTFY_ENABLED" != "true" ]; then
    echo "❌ Notifications are disabled (NTFY_ENABLED=$NTFY_ENABLED)"
    echo ""
    echo "To enable notifications:"
    echo "1. Set NTFY_ENABLED=true in .env"
    echo "2. Set NTFY_TOPIC to a unique value (e.g., mealplanner-alerts-$(uuidgen | cut -d'-' -f1))"
    echo "3. Subscribe to your topic in the ntfy app or web interface"
    echo ""
    exit 1
fi

echo "🧪 Testing Notification System"
echo "================================"
echo ""
echo "Server: $NTFY_SERVER_URL"
echo "Topic: $NTFY_TOPIC"
echo ""
echo "Make sure you're subscribed to this topic in the ntfy app or web interface:"
echo "  Mobile: Open ntfy app and subscribe to '$NTFY_TOPIC'"
echo "  Web: Visit https://ntfy.sh/$NTFY_TOPIC"
echo ""
read -p "Press Enter to continue..."
echo ""

# Test 1: Info notification
echo "📝 Test 1: Sending info notification..."
"$SCRIPT_DIR/send-notification.sh" \
    "default" \
    "Test: Info Notification" \
    "This is a test info notification from the Meal Planner notification system." \
    "information_source,test_tube"

if [ $? -eq 0 ]; then
    echo "✅ Info notification sent"
else
    echo "❌ Failed to send info notification"
    exit 1
fi

sleep 2

# Test 2: Success notification
echo ""
echo "✅ Test 2: Sending success notification..."
"$SCRIPT_DIR/send-notification.sh" \
    "default" \
    "Test: Success Notification" \
    "This is a test success notification. Everything is working correctly!" \
    "white_check_mark,test_tube"

if [ $? -eq 0 ]; then
    echo "✅ Success notification sent"
else
    echo "❌ Failed to send success notification"
    exit 1
fi

sleep 2

# Test 3: Warning notification
echo ""
echo "⚠️  Test 3: Sending warning notification..."
"$SCRIPT_DIR/send-notification.sh" \
    "high" \
    "Test: Warning Notification" \
    "This is a test warning notification. This would indicate a potential issue." \
    "warning,test_tube"

if [ $? -eq 0 ]; then
    echo "✅ Warning notification sent"
else
    echo "❌ Failed to send warning notification"
    exit 1
fi

sleep 2

# Test 4: Critical notification
echo ""
echo "🚨 Test 4: Sending critical notification..."
"$SCRIPT_DIR/send-notification.sh" \
    "urgent" \
    "Test: Critical Notification" \
    "This is a test critical notification. This would require immediate attention!" \
    "rotating_light,test_tube"

if [ $? -eq 0 ]; then
    echo "✅ Critical notification sent"
else
    echo "❌ Failed to send critical notification"
    exit 1
fi

echo ""
echo "================================"
echo "✅ All tests completed successfully!"
echo ""
echo "Check your ntfy app or web interface to verify you received all 4 notifications:"
echo "  1. Info notification (default priority)"
echo "  2. Success notification (default priority)"
echo "  3. Warning notification (high priority)"
echo "  4. Critical notification (urgent priority)"
echo ""
echo "If you didn't receive the notifications, check:"
echo "  - You're subscribed to the correct topic: $NTFY_TOPIC"
echo "  - Your device has notifications enabled"
echo "  - Your network allows connections to $NTFY_SERVER_URL"
echo ""

# Made with Bob