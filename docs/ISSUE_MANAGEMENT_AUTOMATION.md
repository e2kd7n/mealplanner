# Issue Management Automation

## Overview

The `update-issue-priorities.sh` script has been enhanced with robust commit analysis to automatically detect and close completed issues based on recent development work.

## Enhanced Features

### 1. Expanded Commit Analysis
- **Analyzes last 50 commits** (increased from 20)
- **Checks both commit subject and body** for issue references
- **Supports conventional commit patterns** (feat:, fix:, etc.)

### 2. Advanced Pattern Recognition

The script now recognizes multiple completion patterns:

#### Direct Resolution Keywords
```bash
fix #123
close #123
resolve #123
complete #123
implement #123
```

#### Reverse Order Patterns
```bash
#123 fix
#123 close
#123 resolve
#123 complete
#123 implement
```

#### Conventional Commit Patterns
```bash
feat: add feature #123
fix: resolve bug #123
```

#### GitHub Keywords
```bash
Resolves #123
Fixes #123
Closes #123
```

### 3. Documentation Scanning

Automatically scans completion documents for resolved issues:
- `P0_*.md` - P0 critical issue documentation
- `P1_*.md` - P1 high priority documentation
- `*_COMPLETE*.md` - Completion reports
- `*_SUMMARY.md` - Summary documents
- `*_IMPLEMENTATION_SUMMARY.md` - Implementation summaries

### 4. Smart Issue Detection

The script distinguishes between:
- **Issues marked as resolved** - Will be auto-closed with `--auto-close`
- **Issues mentioned but not resolved** - Logged for review but not closed

## Usage

### Basic Usage
```bash
# Generate priority report (no changes)
./scripts/update-issue-priorities.sh

# Preview what would be closed
./scripts/update-issue-priorities.sh --dry-run --auto-close

# Actually close completed issues
./scripts/update-issue-priorities.sh --auto-close
```

### Advanced Options
```bash
# Skip duplicate detection
./scripts/update-issue-priorities.sh --no-duplicates

# Skip automatic label updates
./scripts/update-issue-priorities.sh --no-labels

# Skip development activity analysis
./scripts/update-issue-priorities.sh --no-analysis

# Combine options
./scripts/update-issue-priorities.sh --auto-close --no-duplicates
```

### Help
```bash
./scripts/update-issue-priorities.sh --help
```

## How It Works

### Commit Analysis Flow

1. **Extract Commits**
   ```bash
   git log --format="%H|%s|%b" -50 --no-merges
   ```
   - Gets last 50 commits
   - Includes commit hash, subject, and body
   - Excludes merge commits

2. **Find Issue References**
   ```bash
   grep -oE '#[0-9]+' | sort -u
   ```
   - Extracts all `#123` style references
   - Removes duplicates

3. **Check Issue Status**
   ```bash
   gh issue view "$issue_num" --json state --jq '.state'
   ```
   - Verifies if issue is still open
   - Skips already closed issues

4. **Pattern Matching**
   - Checks commit messages against completion patterns
   - Looks for conventional commit format
   - Validates resolution keywords

5. **Auto-Close (if enabled)**
   ```bash
   gh issue close "$issue_num" --comment "Auto-closed: ..."
   ```
   - Closes issue with explanatory comment
   - Includes relevant commit information

### Documentation Analysis Flow

1. **Scan Completion Documents**
   - Looks for `P0_*.md`, `*_COMPLETE*.md`, etc.
   - Extracts issue numbers from each document

2. **Verify Completion Status**
   - Checks if document contains completion keywords
   - Suggests manual review if needed

3. **Auto-Close Confirmed Issues**
   - Closes issues explicitly marked as completed
   - Adds reference to source document

## Example Output

### Dry Run Mode
```
[12:34:56] 🔍 Running Intelligent Issue Management...

[12:34:57] ✅ No duplicate issues detected
[12:34:58] Checking recent commits for completed work...
[12:34:59] Issue #143 appears resolved (pattern: Resolves #143)
  Would close #143 (use --auto-close to enable)
  Commit: feat: autonomous agents complete P0 and P1 issues
[12:35:00] Issue #144 appears resolved (pattern: fix.*#144)
  Would close #144 (use --auto-close to enable)
  Commit: feat: autonomous agents complete P0 and P1 issues
```

### Auto-Close Mode
```
[12:34:56] 🔍 Running Intelligent Issue Management...

[12:34:57] ✅ No duplicate issues detected
[12:34:58] Checking recent commits for completed work...
[12:34:59] Issue #143 appears resolved (pattern: Resolves #143)
[12:35:00] Auto-closing issue #143 based on commit analysis
[12:35:01] ✅ Closed issue #143
[12:35:02] Issue #144 appears resolved (pattern: fix.*#144)
[12:35:03] Auto-closing issue #144 based on commit analysis
[12:35:04] ✅ Closed issue #144
[12:35:05] ✅ Auto-closed 2 issues based on commits
```

## Best Practices

### Commit Message Format

To ensure issues are automatically detected and closed:

1. **Use GitHub Keywords**
   ```
   Resolves #123, #124
   Fixes #125
   Closes #126
   ```

2. **Use Conventional Commits**
   ```
   feat: add new feature (#123)
   fix: resolve bug (#124)
   ```

3. **Include Issue in Body**
   ```
   feat: add authentication
   
   This commit implements JWT authentication.
   Resolves #123
   ```

### Documentation Format

When creating completion documents:

1. **Use Clear Titles**
   ```markdown
   # P0 Critical Issues - COMPLETED
   ```

2. **List Resolved Issues**
   ```markdown
   ## Issues Resolved
   - #143 - JWT Token Missing Role Field ✅
   - #144 - Rating Field Validation Mismatch ✅
   ```

3. **Include Completion Keywords**
   ```markdown
   All issues have been implemented, tested, and resolved.
   ```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Update Issue Priorities

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight

jobs:
  update-priorities:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Update issue priorities
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          ./scripts/update-issue-priorities.sh --auto-close > ISSUE_PRIORITIES.md
          
      - name: Commit changes
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add ISSUE_PRIORITIES.md
          git commit -m "chore: update issue priorities" || exit 0
          git push
```

## Troubleshooting

### Issues Not Being Detected

1. **Check commit messages** - Ensure they contain issue references
2. **Verify patterns** - Use recognized completion keywords
3. **Check commit range** - Script analyzes last 50 commits only
4. **Run with --dry-run** - See what would be detected

### False Positives

1. **Review patterns** - Adjust completion_patterns array if needed
2. **Use manual review** - Don't use --auto-close for sensitive repos
3. **Check documentation** - Ensure completion docs are accurate

### GitHub API Issues

1. **Check authentication** - Ensure `gh` CLI is authenticated
2. **Verify permissions** - Need write access to close issues
3. **Rate limiting** - Script respects GitHub API limits

## Future Enhancements

Potential improvements for future versions:

1. **Machine Learning** - Train model on historical issue closures
2. **PR Integration** - Analyze PR descriptions and linked issues
3. **Confidence Scoring** - Assign confidence levels to auto-close decisions
4. **Slack/Discord Integration** - Notify team of auto-closed issues
5. **Rollback Capability** - Reopen issues if auto-close was incorrect

## Related Documentation

- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Issue Keywords](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue)

---

**Last Updated:** 2026-04-26  
**Script Version:** Enhanced with robust commit analysis  
**Maintainer:** Development Team