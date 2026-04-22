# Intelligent Issue Management System

## Overview

The `update-issue-priorities.sh` script has been enhanced with intelligent issue management capabilities that automatically detect, deduplicate, and maintain GitHub issues based on development activity and project documentation.

## Features

### 1. **Duplicate Detection** 🔍
Automatically scans all open issues and identifies potential duplicates based on title similarity.

**How it works:**
- Normalizes issue titles (lowercase, removes special characters)
- Groups issues with identical normalized titles
- Reports potential duplicates for manual review

**Example output:**
```
✅ No duplicate issues detected
```

### 2. **Auto-Close Completed Issues** ✅
Automatically closes issues that have been marked as completed in project documentation.

**Sources checked:**
- `P1_ISSUES_COMPLETED.md` - Issues explicitly marked as completed
- `*_COMPLETE*.md` - Completion documentation files
- `*_SUMMARY.md` - Implementation summary files
- `*_IMPLEMENTATION_SUMMARY.md` - Detailed implementation docs

**How it works:**
- Extracts issue numbers from completion documents
- Checks if issues are still open
- Closes them with an auto-generated comment
- Reports number of issues closed

**Example:**
```bash
./scripts/update-issue-priorities.sh --auto-close
```

### 3. **Automatic Label Updates** 🏷️
Intelligently adds missing labels to issues based on keywords in titles and descriptions.

**Label rules:**
- **security**: Issues mentioning "security", "vulnerability", "auth", "csrf", "xss", "sql"
- **bug**: Issues mentioning "bug", "error", "fail", "broken"

**How it works:**
- Scans all open issues
- Checks for keyword matches
- Adds appropriate labels if missing
- Reports number of labels updated

### 4. **Development Activity Analysis** 📊
Analyzes recent git commits to suggest priority updates.

**Checks:**
- Recently modified files (last 10 commits)
- Critical file modifications (auth, security, database, migrations)
- Test file activity
- Suggests priority reviews when critical areas are modified

**Example output:**
```
⚠️  Critical files modified recently - review P0/P1 issues for updates
✅ Significant test activity detected (8 test files)
```

### 5. **TODO Comment Tracking** 📝
Scans codebase for TODO/FIXME comments that should become GitHub issues.

**Supported markers:**
- `TODO: #issue` or `TODO: [create-issue]` - Marks TODO for issue creation
- `FIXME: #issue` or `FIXME: [create-issue]` - Marks bug for issue creation

**How it works:**
- Searches all source files (`.ts`, `.tsx`, `.js`, `.jsx`)
- Finds comments with issue markers
- Reports them for manual review
- Can auto-create issues with `--create-todos` flag (future feature)

## Usage

### Basic Usage
```bash
# Normal run - generates ISSUE_PRIORITIES.md with all checks
./scripts/update-issue-priorities.sh > ISSUE_PRIORITIES.md

# View help
./scripts/update-issue-priorities.sh --help
```

### Advanced Options

#### Auto-Close Completed Issues
```bash
# Preview what would be closed (dry run)
./scripts/update-issue-priorities.sh --dry-run --auto-close

# Actually close completed issues
./scripts/update-issue-priorities.sh --auto-close > ISSUE_PRIORITIES.md
```

#### Skip Specific Checks
```bash
# Skip duplicate detection
./scripts/update-issue-priorities.sh --no-duplicates > ISSUE_PRIORITIES.md

# Skip automatic label updates
./scripts/update-issue-priorities.sh --no-labels > ISSUE_PRIORITIES.md

# Skip development activity analysis
./scripts/update-issue-priorities.sh --no-analysis > ISSUE_PRIORITIES.md
```

#### Combine Options
```bash
# Auto-close and skip duplicate detection
./scripts/update-issue-priorities.sh --auto-close --no-duplicates > ISSUE_PRIORITIES.md
```

## Command-Line Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Show what would be done without making changes |
| `--auto-close` | Automatically close completed issues |
| `--no-duplicates` | Skip duplicate detection |
| `--no-labels` | Skip automatic label updates |
| `--no-analysis` | Skip development activity analysis |
| `--help` | Show help message |

## Output

### Console Output (stderr)
The script logs all actions to stderr with colored output:
- 🔵 **Blue**: Action in progress
- ✅ **Green**: Success
- ⚠️ **Yellow**: Warning
- ❌ **Red**: Error

### Markdown Output (stdout)
Clean markdown report written to `ISSUE_PRIORITIES.md`:
- Issue lists by priority (P0-P4)
- Unprioritized issues
- Workspace TODO comments
- Priority guidelines

## Workflow Integration

### Daily Workflow
```bash
# Morning: Check for issues that need attention
./scripts/update-issue-priorities.sh > ISSUE_PRIORITIES.md
git add ISSUE_PRIORITIES.md
git commit -m "chore: update issue priorities"
```

### After Completing Work
```bash
# Update P1_ISSUES_COMPLETED.md with completed issues
echo "- #123 - Feature X implemented" >> P1_ISSUES_COMPLETED.md

# Auto-close completed issues
./scripts/update-issue-priorities.sh --auto-close > ISSUE_PRIORITIES.md
git add ISSUE_PRIORITIES.md P1_ISSUES_COMPLETED.md
git commit -m "chore: close completed issues and update priorities"
```

### Weekly Maintenance
```bash
# Full check with all features
./scripts/update-issue-priorities.sh --auto-close > ISSUE_PRIORITIES.md

# Review output for:
# - Duplicate issues to merge
# - Issues that need priority updates
# - TODO comments that should become issues
```

## Best Practices

### 1. Document Completed Work
Always document completed issues in:
- `P1_ISSUES_COMPLETED.md` for high-priority completions
- `*_IMPLEMENTATION_SUMMARY.md` for feature implementations
- `*_COMPLETE.md` for major milestones

### 2. Use Consistent Issue Titles
- Start with `[P0]`, `[P1]`, etc. for priority
- Use `[Bug]`, `[Feature]`, `[UX]`, etc. for type
- Be descriptive but concise

### 3. Mark TODOs for Issue Creation
```typescript
// TODO: [create-issue] Add input validation for email field
// FIXME: #issue Handle edge case when user has no recipes
```

### 4. Review Before Auto-Closing
Always use `--dry-run` first to preview what will be closed:
```bash
./scripts/update-issue-priorities.sh --dry-run --auto-close
```

### 5. Keep Labels Updated
The script automatically adds labels, but you can also:
- Use GitHub's label system for additional categorization
- Create custom labels for your workflow
- The script respects existing labels and only adds missing ones

## Troubleshooting

### Issue: Script reports "gh: command not found"
**Solution:** Install GitHub CLI:
```bash
brew install gh
gh auth login
```

### Issue: Script reports "jq: command not found"
**Solution:** Install jq:
```bash
brew install jq
```

### Issue: Duplicate detection not working
**Solution:** Ensure you have at least 2 open issues with similar titles

### Issue: Auto-close not working
**Solution:** 
1. Check that issues are mentioned in completion docs with `#` prefix
2. Verify you have permission to close issues
3. Use `--dry-run` to see what would be closed

## Future Enhancements

### Planned Features
1. **Auto-create issues from TODOs** - `--create-todos` flag
2. **Priority auto-adjustment** - Based on activity and age
3. **Stale issue detection** - Flag issues with no activity
4. **Dependency tracking** - Link related issues
5. **Milestone integration** - Auto-assign to milestones
6. **Slack/Discord notifications** - Alert on critical issues

### Contributing
To add new features:
1. Add function to `scripts/update-issue-priorities.sh`
2. Add command-line option in argument parsing
3. Update this documentation
4. Test with `--dry-run` first

## Examples

### Example 1: Weekly Maintenance
```bash
# Monday morning routine
cd /path/to/mealplanner

# Update priorities and auto-close completed work
./scripts/update-issue-priorities.sh --auto-close > ISSUE_PRIORITIES.md

# Review the output
cat ISSUE_PRIORITIES.md

# Commit changes
git add ISSUE_PRIORITIES.md
git commit -m "chore: weekly issue maintenance"
git push
```

### Example 2: After Major Feature
```bash
# Document completion
cat >> BROWSE_RECIPES_IMPLEMENTATION_SUMMARY.md << EOF
## Completed Issues
- #71 - Spoonacular search fixed
- #72 - Meal planning restored
- #73 - Recipe creation working
EOF

# Auto-close and update
./scripts/update-issue-priorities.sh --auto-close > ISSUE_PRIORITIES.md

# Verify
gh issue list --state closed --limit 5
```

### Example 3: Pre-Release Check
```bash
# Full analysis before release
./scripts/update-issue-priorities.sh > ISSUE_PRIORITIES.md

# Check for P0/P1 issues
grep -A 10 "P0 - CRITICAL" ISSUE_PRIORITIES.md
grep -A 10 "P1 - HIGH" ISSUE_PRIORITIES.md

# Ensure no blockers
if grep -q "P0 - CRITICAL" ISSUE_PRIORITIES.md; then
  echo "❌ Cannot release - P0 issues exist"
  exit 1
fi
```

## Related Documentation

- [ISSUE_PRIORITIES.md](ISSUE_PRIORITIES.md) - Current issue priorities
- [P1_ISSUES_COMPLETED.md](P1_ISSUES_COMPLETED.md) - Completed high-priority issues
- [USER_TESTING_ISSUES_FOUND.md](USER_TESTING_ISSUES_FOUND.md) - Issues from user testing
- [GITHUB_ISSUES_V1.1_USER_TESTING.md](GITHUB_ISSUES_V1.1_USER_TESTING.md) - Issue templates

## Support

For issues or questions:
1. Check this documentation
2. Run with `--help` flag
3. Review script source code
4. Create a GitHub issue with `[issue-management]` tag

---

**Last Updated:** 2026-04-20  
**Script Version:** 2.0 (Intelligent Issue Management)  
**Maintainer:** Development Team