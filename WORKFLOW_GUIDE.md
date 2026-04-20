# Workflow Guide for Bob

## Issue Management Guidelines

### When to Create Local Markdown Files for Issues

**DO CREATE** local markdown files when:
- The issue is small enough to be worked on in the current session
- You need to draft complex issue content before creating it
- The file serves as working documentation during implementation

**DO NOT CREATE** local markdown files when:
- The issue is large or multi-phase
- The issue will span multiple sessions
- GitHub issues have already been created

### Proper Workflow for Large Features

1. **Draft issue content** in a temporary local file if needed
2. **Create GitHub issues immediately** using `gh issue create`
3. **Delete the local markdown file** after GitHub issues are created
4. **Reference GitHub issue numbers** in code and documentation

### Cleanup Checklist

At logical pause points, always:
- [ ] Check for local markdown files containing issue content
- [ ] Verify corresponding GitHub issues exist
- [ ] Remove local markdown files that duplicate GitHub issues
- [ ] Update documentation to reference GitHub issue numbers

## Key Principles

1. **GitHub is the source of truth** for issues and tasks
2. **Local files are temporary** - clean them up promptly
3. **Don't duplicate information** between local files and GitHub
4. **Reference by issue number** not by local file paths

## Example Commands

```bash
# Create GitHub issue
gh issue create --title "Feature Title" --label "enhancement" --body "Description"

# Remove local issue files after GitHub creation
rm ISSUE_*.md FEATURE_*.md

# Check for orphaned issue files
find . -name "*ISSUE*.md" -o -name "*FEATURE*.md" | grep -v node_modules
```

## This Guideline

This document itself should be:
- Kept up to date with workflow improvements
- Referenced when planning large features
- Reviewed before creating issue documentation