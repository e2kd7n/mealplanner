#!/bin/bash
# Copyright (c) 2026 e2kd7n
# All rights reserved.

# Export user feedback from the application
# This script exports feedback data to a JSON file for review

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
EXPORT_DIR="./data/feedback-exports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_FILE="${EXPORT_DIR}/feedback_${TIMESTAMP}.json"

# Admin credentials (should be set via environment or prompted)
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
API_URL="${API_URL:-http://localhost:3000}"

echo -e "${GREEN}=== Feedback Export Tool ===${NC}"
echo ""

# Create export directory if it doesn't exist
mkdir -p "${EXPORT_DIR}"

# Prompt for admin credentials if not set
if [ -z "$ADMIN_EMAIL" ]; then
    read -p "Admin email: " ADMIN_EMAIL
fi

if [ -z "$ADMIN_PASSWORD" ]; then
    read -sp "Admin password: " ADMIN_PASSWORD
    echo ""
fi

echo -e "${YELLOW}Authenticating...${NC}"

# Authenticate and get token
AUTH_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}")

TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Authentication failed. Please check your credentials.${NC}"
    exit 1
fi

echo -e "${GREEN}Authentication successful${NC}"
echo -e "${YELLOW}Exporting feedback...${NC}"

# Export feedback
curl -s -X GET "${API_URL}/api/feedback/export" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -o "${EXPORT_FILE}"

if [ $? -eq 0 ]; then
    # Get feedback count
    FEEDBACK_COUNT=$(grep -o '"totalRecords":[0-9]*' "${EXPORT_FILE}" | cut -d':' -f2)
    
    echo -e "${GREEN}✓ Feedback exported successfully${NC}"
    echo -e "  File: ${EXPORT_FILE}"
    echo -e "  Total records: ${FEEDBACK_COUNT}"
    echo ""
    echo -e "${YELLOW}Export summary:${NC}"
    
    # Show summary statistics
    echo "  - Pending: $(grep -o '"status":"pending"' "${EXPORT_FILE}" | wc -l)"
    echo "  - Reviewed: $(grep -o '"status":"reviewed"' "${EXPORT_FILE}" | wc -l)"
    echo "  - In Progress: $(grep -o '"status":"in_progress"' "${EXPORT_FILE}" | wc -l)"
    echo "  - Resolved: $(grep -o '"status":"resolved"' "${EXPORT_FILE}" | wc -l)"
    echo ""
    echo "  - Bugs: $(grep -o '"feedbackType":"bug"' "${EXPORT_FILE}" | wc -l)"
    echo "  - Features: $(grep -o '"feedbackType":"feature"' "${EXPORT_FILE}" | wc -l)"
    echo "  - Improvements: $(grep -o '"feedbackType":"improvement"' "${EXPORT_FILE}" | wc -l)"
    echo "  - Questions: $(grep -o '"feedbackType":"question"' "${EXPORT_FILE}" | wc -l)"
    echo ""
else
    echo -e "${RED}✗ Export failed${NC}"
    exit 1
fi

# Optional: Copy to a shared location or upload to GitHub
if [ "$UPLOAD_TO_GITHUB" = "true" ]; then
    echo -e "${YELLOW}Uploading to GitHub...${NC}"
    # This would require GitHub CLI or API integration
    # gh repo upload feedback-data "${EXPORT_FILE}"
    echo -e "${YELLOW}Note: GitHub upload not implemented. Please manually upload ${EXPORT_FILE}${NC}"
fi

echo -e "${GREEN}Done!${NC}"

# Made with Bob
