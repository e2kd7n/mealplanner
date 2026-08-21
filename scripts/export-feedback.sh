#!/bin/bash
# Copyright (c) 2026 e2kd7n
# All rights reserved.

# Export user feedback from the application
# This script exports feedback data to a JSON file for review

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

# Configuration
EXPORT_DIR="./data/feedback-exports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_FILE="${EXPORT_DIR}/feedback_${TIMESTAMP}.json"

# Admin credentials (should be set via environment or prompted)
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
API_URL="${API_URL:-http://localhost:3000}"

section "Feedback Export" "📥"

mkdir -p "${EXPORT_DIR}"

if [ -z "$ADMIN_EMAIL" ]; then
    read -p "Admin email: " ADMIN_EMAIL
fi

if [ -z "$ADMIN_PASSWORD" ]; then
    read -sp "Admin password: " ADMIN_PASSWORD
    echo ""
fi

section "Authenticating" "🔐"

timer_start
start_spinner "Logging in to ${API_URL}"

AUTH_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}")

TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    stop_spinner fail
    echo -e "  ${RED}❌ Authentication failed. Please check your credentials.${NC}"
    exit 1
fi

stop_spinner ok

section "Downloading Export" "📥"

start_spinner "Downloading feedback export"
curl -s -X GET "${API_URL}/api/feedback/export" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -o "${EXPORT_FILE}"
curl_status=$?

if [ $curl_status -eq 0 ]; then
    stop_spinner ok
    timer_end

    FEEDBACK_COUNT=$(grep -o '"totalRecords":[0-9]*' "${EXPORT_FILE}" | cut -d':' -f2)

    echo -e "  ${GREEN}✓${NC}  Feedback exported successfully"
    echo -e "     ${BOLD}File:${NC}          ${EXPORT_FILE}"
    echo -e "     ${BOLD}Total records:${NC} ${FEEDBACK_COUNT}"

    echo -e "\n  ${BLUE}ℹ️  Export summary:${NC}"
    echo -e "     - Pending:     $(grep -o '"status":"pending"' "${EXPORT_FILE}" | wc -l)"
    echo -e "     - Reviewed:    $(grep -o '"status":"reviewed"' "${EXPORT_FILE}" | wc -l)"
    echo -e "     - In Progress: $(grep -o '"status":"in_progress"' "${EXPORT_FILE}" | wc -l)"
    echo -e "     - Resolved:    $(grep -o '"status":"resolved"' "${EXPORT_FILE}" | wc -l)"
    echo ""
    echo -e "     - Bugs:        $(grep -o '"feedbackType":"bug"' "${EXPORT_FILE}" | wc -l)"
    echo -e "     - Features:    $(grep -o '"feedbackType":"feature"' "${EXPORT_FILE}" | wc -l)"
    echo -e "     - Improvements: $(grep -o '"feedbackType":"improvement"' "${EXPORT_FILE}" | wc -l)"
    echo -e "     - Questions:   $(grep -o '"feedbackType":"question"' "${EXPORT_FILE}" | wc -l)"
else
    stop_spinner fail
    echo -e "  ${RED}✗ Export failed${NC}"
    exit 1
fi

# Optional: Copy to a shared location or upload to GitHub
if [ "$UPLOAD_TO_GITHUB" = "true" ]; then
    section "Upload" "🌐"
    echo -e "  ${YELLOW}⚠️  GitHub upload not implemented. Please manually upload ${EXPORT_FILE}${NC}"
fi

section "Summary" "🍽️"
echo -e "  ${GREEN}✓${NC}  Done!"
