# Product Manager Guide: Feedback Collection & Issue Management

**Purpose**: Guide for Senior Product Manager to review feedback and create prioritized GitHub issues  
**Related Issue**: #133 - In-App User Feedback System  
**Date**: April 25, 2026

## Overview

This guide provides step-by-step instructions for the Senior Product Manager to:
1. Access and review collected feedback
2. Export feedback data for analysis
3. Create GitHub issues from feedback
4. Prioritize issues for the Public Launch milestone

## Prerequisites

- Admin access to the application
- GitHub repository write access
- Familiarity with GitHub issue creation
- Understanding of project priorities (P0, P1, P2, P3)

## Step 1: Access Feedback Dashboard

### Login as Admin

1. Navigate to the application
2. Login with admin credentials
3. Go to Admin Dashboard (`/admin`)
4. Access the Feedback section

### Review Feedback Statistics

The feedback dashboard provides:
- Total feedback count
- Breakdown by status (pending, reviewed, in_progress, resolved, wont_fix)
- Breakdown by type (bug, feature, improvement, question, other)
- Recent feedback items

## Step 2: Review Individual Feedback Items

### Feedback Review Process

For each feedback item, review:

1. **Feedback Type**: Bug, Feature, Improvement, Question, or Other
2. **User Information**: Who submitted it (email, family name)
3. **Page Context**: Where in the app the feedback was submitted
4. **Rating**: User's satisfaction rating (1-5 stars, if provided)
5. **Message**: Detailed feedback description
6. **Screenshot**: Visual context (if captured)
7. **Timestamp**: When it was submitted

### Categorization Guidelines

**Bugs** 🐛
- System errors or unexpected behavior
- UI/UX issues that prevent task completion
- Data inconsistencies
- Performance problems

**Feature Requests** 💡
- New functionality suggestions
- Enhancement to existing features
- Integration requests
- Workflow improvements

**Improvements** ✨
- UI/UX refinements
- Performance optimizations
- Accessibility enhancements
- User experience polish

**Questions** ❓
- User confusion about features
- Documentation gaps
- Unclear workflows
- Help requests

## Step 3: Export Feedback Data

### Using the Export Script

```bash
# From project root directory
./scripts/export-feedback.sh

# Enter admin credentials when prompted
# Admin email: your-admin@email.com
# Admin password: ********

# Output will be saved to:
# ./data/feedback-exports/feedback_TIMESTAMP.json
```

### Export File Structure

```json
{
  "exportDate": "2026-04-25T22:00:00.000Z",
  "totalRecords": 18,
  "filters": {},
  "feedback": [
    {
      "id": "uuid",
      "userId": "uuid",
      "page": "/recipes",
      "feedbackType": "bug",
      "rating": 3,
      "message": "Recipe images not loading properly",
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

### Analyze Export Data

Review the exported JSON to:
- Identify patterns and trends
- Group similar feedback items
- Prioritize based on frequency
- Assess impact on user experience

## Step 4: Create GitHub Issues

### Issue Creation Workflow

For each actionable feedback item:

1. **Determine if issue creation is needed**
   - Is it a duplicate of existing issue?
   - Is it actionable?
   - Is it within project scope?
   - Does it align with Public Launch goals?

2. **Create GitHub issue** with:
   - Clear, descriptive title
   - Detailed description
   - Reproduction steps (for bugs)
   - User context and impact
   - Link to original feedback
   - Screenshots (if available)

3. **Add appropriate labels**:
   - Type: `bug`, `enhancement`, `question`, `documentation`
   - Priority: `P0-critical`, `P1-high`, `P2-medium`, `P3-low`
   - Milestone: `Public Launch` (if applicable)
   - Area: `frontend`, `backend`, `design`, `ux`

4. **Assign to appropriate team member**

### Issue Template

```markdown
## Issue Title
[Type] Brief description from user perspective

## Description
Detailed description of the feedback/issue

## User Feedback
> Original feedback message from user

**Submitted by**: [User email/family name]  
**Page**: [Page where feedback was submitted]  
**Rating**: [User rating if provided]  
**Date**: [Submission date]

## Expected Behavior
What should happen

## Actual Behavior
What currently happens (for bugs)

## Steps to Reproduce (for bugs)
1. Step 1
2. Step 2
3. Step 3

## Impact
- **User Impact**: [High/Medium/Low]
- **Frequency**: [How often does this occur]
- **Workaround**: [Is there a workaround available]

## Screenshots
[Attach any screenshots from feedback]

## Additional Context
Any other relevant information

## Related Issues
- Links to related issues
- Original feedback ID: [feedback UUID]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

## Step 5: Prioritize Issues

### Priority Levels

**P0 - Critical** 🔴
- Blocks Public Launch
- Severe bugs affecting core functionality
- Security vulnerabilities
- Data loss issues
- Complete feature failures

**P1 - High** 🟠
- Required for Public Launch
- Significant user experience issues
- Important feature gaps
- Performance problems
- Accessibility violations

**P2 - Medium** 🟡
- Nice to have for Public Launch
- Minor bugs with workarounds
- UI polish items
- Enhancement requests
- Documentation improvements

**P3 - Low** 🟢
- Post-launch improvements
- Minor enhancements
- Edge cases
- Future considerations

### Prioritization Criteria

Consider:
1. **Impact on users**: How many users affected?
2. **Severity**: How bad is the issue?
3. **Frequency**: How often does it occur?
4. **Public Launch readiness**: Is it required for launch?
5. **Effort required**: Quick fix vs. major work?
6. **Dependencies**: Does it block other work?

## Step 6: Update Feedback Status

After creating issues, update feedback status in the admin panel:

### Status Definitions

- **Pending**: New feedback, not yet reviewed
- **Reviewed**: Feedback has been reviewed by PM
- **In Progress**: GitHub issue created, work in progress
- **Resolved**: Issue has been fixed/implemented
- **Won't Fix**: Feedback noted but not actionable

### Update Process

1. Navigate to feedback item in admin panel
2. Click "Edit" or "Update Status"
3. Select new status
4. Add admin notes with:
   - GitHub issue number (if created)
   - Reason for status change
   - Any additional context
5. Save changes

## Step 7: Create Summary Report

### Report Template

```markdown
# Feedback Collection Summary Report

**Testing Period**: [Start Date] - [End Date]  
**Total Feedback Items**: [Number]  
**Testers**: 3 Engineers, 3 Designers, 1 PM  
**Report Date**: [Date]

## Executive Summary
Brief overview of feedback collection results and key findings.

## Feedback Statistics

### By Type
- Bugs: [Count] ([Percentage]%)
- Feature Requests: [Count] ([Percentage]%)
- Improvements: [Count] ([Percentage]%)
- Questions: [Count] ([Percentage]%)
- Other: [Count] ([Percentage]%)

### By Status
- Pending: [Count]
- Reviewed: [Count]
- In Progress: [Count]
- Resolved: [Count]
- Won't Fix: [Count]

### By Priority (Issues Created)
- P0 Critical: [Count]
- P1 High: [Count]
- P2 Medium: [Count]
- P3 Low: [Count]

## Key Findings

### Top Issues
1. [Issue description] - Priority: [P0/P1/P2/P3]
2. [Issue description] - Priority: [P0/P1/P2/P3]
3. [Issue description] - Priority: [P0/P1/P2/P3]

### Common Themes
- Theme 1: [Description]
- Theme 2: [Description]
- Theme 3: [Description]

### User Experience Insights
- Insight 1
- Insight 2
- Insight 3

## GitHub Issues Created

### P0 - Critical
- [ ] #[number] - [Title]

### P1 - High
- [ ] #[number] - [Title]
- [ ] #[number] - [Title]

### P2 - Medium
- [ ] #[number] - [Title]
- [ ] #[number] - [Title]

### P3 - Low
- [ ] #[number] - [Title]

## Public Launch Readiness

### Blockers (P0/P1 Issues)
- [List of issues that must be resolved before launch]

### Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

### Timeline Impact
- Estimated time to resolve P0/P1 issues: [X days/weeks]
- Recommended launch date: [Date]

## Process Improvements

### What Worked Well
- [Success 1]
- [Success 2]

### Areas for Improvement
- [Improvement 1]
- [Improvement 2]

### Recommendations for Future Testing
- [Recommendation 1]
- [Recommendation 2]

## Next Steps

1. [ ] Address all P0 issues immediately
2. [ ] Schedule work for P1 issues
3. [ ] Triage P2/P3 issues for post-launch
4. [ ] Update Public Launch milestone
5. [ ] Communicate findings to team
6. [ ] Schedule follow-up review

## Appendix

### Feedback Export
- Export file: `feedback_[TIMESTAMP].json`
- Location: `./data/feedback-exports/`

### Testing Documentation
- Testing guide: `docs/usertesting/ISSUE_133_FEEDBACK_SYSTEM_TESTING.md`
- Related issue: #133
```

## Best Practices

### Do's ✅
- Review all feedback thoroughly
- Create clear, actionable issues
- Prioritize based on impact and urgency
- Link feedback to GitHub issues
- Update feedback status promptly
- Communicate findings to team
- Document decisions and rationale

### Don'ts ❌
- Don't ignore any feedback
- Don't create duplicate issues
- Don't over-prioritize everything as P0
- Don't forget to update feedback status
- Don't skip the summary report
- Don't make decisions in isolation

## Tools & Resources

### GitHub Issue Management
- Use GitHub Projects for tracking
- Link issues to Public Launch milestone
- Use labels consistently
- Assign issues appropriately

### Communication
- Share summary report with team
- Schedule review meetings
- Update stakeholders on progress
- Celebrate quick wins

### Metrics to Track
- Time to review feedback
- Issue creation rate
- Issue resolution rate
- User satisfaction trends
- System adoption rate

## Troubleshooting

### Common Issues

**Can't access feedback dashboard**
- Verify admin role is assigned
- Check authentication token
- Clear browser cache

**Export script fails**
- Verify admin credentials
- Check API endpoint is accessible
- Ensure export directory exists

**Too much feedback to review**
- Use filters to focus on specific types
- Review in batches
- Delegate review to team members

## Support

For questions or assistance:
- Technical issues: Engineering Team
- Process questions: Product Leadership
- GitHub access: Repository Admin

---

**Document Version**: 1.0  
**Last Updated**: April 25, 2026  
**Maintained by**: Product Management Team