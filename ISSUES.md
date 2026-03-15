# Project Issues

## Open Issues

### Issue #1: Implement anti-piracy features
**Status:** Resolved - Not Applicable
**Priority:** High
**Resolution:** For a self-hosted, private family application, extensive anti-piracy measures are unnecessary. Basic access control through family-based authentication and invite-only system (already planned) provides sufficient protection. If sharing with other families in the future, can implement additional measures as needed.

**Completed:**
- [x] Assessed anti-piracy needs for private use case
- [x] Documented approach in plan (access control via authentication)
- [x] Noted optional measures for future multi-family sharing

---

### Issue #2: Add copyright notices to all source files
**Status:** In Progress
**Priority:** High
**Description:** Add proper copyright notices to all source code files to establish ownership and legal protections.

**Tasks:**
- [x] Create standard copyright header template (in plan document)
- [ ] Add copyright notices to all source files (during implementation)
- [ ] Set up pre-commit hook to ensure new files include copyright

**Template Created:**
```
Copyright (c) 2026 Erik Didriksen
All rights reserved.
```

---

### Issue #3: Create and add appropriate license file
**Status:** Closed
**Priority:** High
**Resolution:** LICENSE file created with proprietary license for personal/family use.

**Completed:**
- [x] Chose appropriate license type (Proprietary for private use)
- [x] Created LICENSE file
- [x] Documented license in plan
- [ ] Update README with license information (when README is created)

---

### Issue #4: Ensure proper attribution and legal protections
**Status:** Closed
**Priority:** Medium
**Resolution:** ATTRIBUTION.md created with comprehensive list of third-party dependencies and their licenses. All dependencies are compatible with proprietary use.

**Completed:**
- [x] Documented all planned dependencies
- [x] Verified license compatibility (all MIT, Apache 2.0, BSD, PostgreSQL License)
- [x] Created ATTRIBUTION.md file
- [x] Documented external API attribution requirements
- [x] Reviewed patent considerations (none applicable)
- [ ] Terms of service (optional, only if sharing with other families)

---

## Closed Issues

### Issue #3: Create and add appropriate license file
**Closed:** March 14, 2026
**Resolution:** LICENSE file created with proprietary license suitable for personal/family use.

### Issue #4: Ensure proper attribution and legal protections
**Closed:** March 14, 2026
**Resolution:** ATTRIBUTION.md created with comprehensive third-party license documentation.

## Notes

- Anti-piracy measures deemed unnecessary for private, self-hosted use
- Copyright headers will be added to source files during implementation phase
- Pre-commit hook for copyright enforcement will be set up during development
- Terms of service only needed if application is shared with other families