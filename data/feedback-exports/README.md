# Feedback Exports Directory

This directory stores exported user feedback data from the in-app feedback system.

## Purpose

Feedback exports are used for:
- Product manager review and analysis
- Creating GitHub issues from user feedback
- Tracking feedback trends over time
- Backup and archival purposes

## Export Format

Exports are saved as JSON files with the naming convention:
```
feedback_YYYYMMDD_HHMMSS.json
```

Example: `feedback_20260425_220000.json`

## Export Structure

```json
{
  "exportDate": "2026-04-25T22:00:00.000Z",
  "totalRecords": 18,
  "filters": {
    "status": "pending",
    "feedbackType": "bug"
  },
  "feedback": [
    {
      "id": "uuid",
      "userId": "uuid",
      "page": "/recipes",
      "feedbackType": "bug",
      "rating": 3,
      "message": "Feedback message",
      "screenshot": "base64_or_url",
      "status": "pending",
      "adminNotes": null,
      "createdAt": "2026-04-25T21:00:00.000Z",
      "updatedAt": "2026-04-25T21:00:00.000Z",
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "familyName": "Smith Family"
      }
    }
  ]
}
```

## How to Export

### Using the Export Script

```bash
# From project root
./scripts/export-feedback.sh

# You will be prompted for admin credentials
# The export will be saved to this directory
```

### Using the API Directly

```bash
# Get auth token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.token')

# Export feedback
curl -X GET http://localhost:3000/api/feedback/export \
  -H "Authorization: Bearer $TOKEN" \
  -o feedback_$(date +%Y%m%d_%H%M%S).json
```

## Security Notes

⚠️ **Important**: Feedback exports may contain:
- User email addresses
- Personal feedback messages
- Screenshots that may contain sensitive information

**Best Practices**:
- Do not commit exports to version control (already in .gitignore)
- Store exports securely
- Delete old exports after review
- Limit access to admin users only

## Retention Policy

- Keep exports for 90 days
- Archive important exports separately
- Delete exports after issues are created and resolved

## Related Documentation

- Testing Guide: `docs/usertesting/ISSUE_133_FEEDBACK_SYSTEM_TESTING.md`
- PM Guide: `docs/usertesting/FEEDBACK_COLLECTION_PM_GUIDE.md`
- Implementation: `docs/releases/public-launch/ISSUE_133_IMPLEMENTATION_COMPLETE.md`

---

**Last Updated**: April 25, 2026