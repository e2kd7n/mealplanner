# Security Remediation Plan - 2026-04-21

**Date:** April 21, 2026  
**Scan Type:** pnpm audit (Backend + Frontend)  
**Total Vulnerabilities:** 26 unique advisories

---

## Executive Summary

Security audits identified 26 vulnerabilities across backend and frontend dependencies:
- **Backend:** 14 vulnerabilities (1 low, 7 moderate, 6 high, 0 critical)
- **Frontend:** 12 vulnerabilities (0 low, 8 moderate, 4 high, 0 critical)

**Priority Actions:**
1. Upgrade axios to 1.15.0+ (fixes 2 moderate severity issues)
2. Upgrade vite to 8.0.5+ (fixes 3 high severity issues)
3. Upgrade picomatch to 4.0.4+ (fixes 2 high severity ReDoS issues)
4. Update development dependencies (low risk, can be scheduled)

---

## 🔴 HIGH SEVERITY (10 Issues)

### Backend High Severity (6 issues)

#### 1. effect - AsyncLocalStorage Context Contamination (CVE-2026-32887)
- **Advisory:** #1115356
- **CVSS:** 7.4 (High)
- **Module:** effect@3.18.4
- **Path:** `.>prisma>@prisma/config>effect`
- **Impact:** Authentication bypass - ALS context lost under concurrent load
- **Fix:** Upgrade to effect@3.20.0+
- **Priority:** P1 - High (but indirect dependency via Prisma)
- **Remediation:** Update Prisma to latest version

#### 2. flatted - Prototype Pollution (CVE-2026-33228)
- **Advisory:** #1115357
- **CVSS:** Not scored (High)
- **Module:** flatted@3.4.1
- **Path:** `.>eslint>file-entry-cache>flat-cache>flatted`
- **Impact:** Prototype pollution via parse()
- **Fix:** Upgrade to flatted@3.4.2+
- **Priority:** P2 - Medium (dev dependency only)
- **Remediation:** Update eslint dependencies

#### 3. path-to-regexp - ReDoS (CVE-2026-4867)
- **Advisory:** #1115527
- **CVSS:** 7.5 (High)
- **Module:** path-to-regexp@0.1.12
- **Path:** `.>express>path-to-regexp`
- **Impact:** Regular Expression Denial of Service
- **Fix:** Upgrade to path-to-regexp@0.1.13+
- **Priority:** P1 - High (production dependency)
- **Remediation:** Update express to latest version

#### 4. picomatch - ReDoS via extglob (CVE-2026-33671)
- **Advisory:** #1115552, #1115554
- **CVSS:** 7.5 (High)
- **Module:** picomatch@2.3.1, picomatch@4.0.3
- **Paths:** Multiple (nodemon, typescript-eslint)
- **Impact:** ReDoS with crafted extglob patterns
- **Fix:** Upgrade to picomatch@2.3.2+ or 4.0.4+
- **Priority:** P2 - Medium (dev dependencies)
- **Remediation:** Update nodemon and typescript-eslint

#### 5. defu - Prototype Pollution (CVE-2026-35209)
- **Advisory:** #1116102
- **CVSS:** 7.5 (High)
- **Module:** defu@6.1.4
- **Path:** `.>prisma>@prisma/config>c12>defu`
- **Impact:** Prototype pollution via __proto__ key
- **Fix:** Upgrade to defu@6.1.5+
- **Priority:** P1 - High (but indirect via Prisma)
- **Remediation:** Update Prisma to latest version

### Frontend High Severity (4 issues)

#### 6. vite - Path Traversal in .map Handling (CVE-2026-39365)
- **Advisory:** #1116231
- **CVSS:** Not scored (High)
- **Module:** vite@8.0.0
- **Impact:** Path traversal to read .map files outside project
- **Fix:** Upgrade to vite@8.0.5+
- **Priority:** P1 - High (dev server vulnerability)
- **Remediation:** `pnpm update vite@latest`

#### 7. vite - server.fs.deny Bypass (CVE-2026-39364)
- **Advisory:** #1116233
- **CVSS:** Not scored (High)
- **Module:** vite@8.0.0
- **Impact:** Bypass fs.deny with query parameters
- **Fix:** Upgrade to vite@8.0.5+
- **Priority:** P1 - High (dev server vulnerability)
- **Remediation:** `pnpm update vite@latest`

#### 8. vite - Arbitrary File Read via WebSocket (CVE-2026-39363)
- **Advisory:** #1116236
- **CVSS:** Not scored (High)
- **Module:** vite@8.0.0
- **Impact:** Read arbitrary files via WebSocket fetchModule
- **Fix:** Upgrade to vite@8.0.5+
- **Priority:** P1 - High (dev server vulnerability)
- **Remediation:** `pnpm update vite@latest`

#### 9. flatted - Prototype Pollution (CVE-2026-33228)
- **Advisory:** #1115357
- **Module:** flatted@3.4.1
- **Path:** `.>eslint>file-entry-cache>flat-cache>flatted`
- **Impact:** Same as backend #2
- **Fix:** Upgrade to flatted@3.4.2+
- **Priority:** P2 - Medium (dev dependency)

#### 10. picomatch - ReDoS (CVE-2026-33671)
- **Advisory:** #1115554
- **Module:** picomatch@4.0.3
- **Path:** `.>typescript-eslint>@typescript-eslint/typescript-estree>tinyglobby>picomatch`
- **Impact:** Same as backend #4
- **Fix:** Upgrade to picomatch@4.0.4+
- **Priority:** P2 - Medium (dev dependency)

---

## 🟡 MODERATE SEVERITY (15 Issues)

### Backend Moderate (7 issues)

#### 11. cookie - Out of Bounds Characters (CVE-2024-47764)
- **Advisory:** #1103907
- **CVSS:** 0 (Low severity despite classification)
- **Module:** cookie@0.4.0
- **Path:** `.>csurf>cookie`
- **Impact:** Cookie name can set other fields
- **Fix:** Upgrade to cookie@0.7.0+
- **Priority:** P2 - Medium
- **Remediation:** Update csurf or replace with alternative

#### 12-13. brace-expansion - Zero-step DoS (CVE-2026-33750)
- **Advisory:** #1115543
- **CVSS:** 6.5 (Moderate)
- **Module:** brace-expansion@5.0.4
- **Paths:** Multiple (typescript-eslint)
- **Impact:** Process hang with zero-step sequences
- **Fix:** Upgrade to brace-expansion@5.0.5+
- **Priority:** P3 - Low (dev dependency)

#### 14-15. picomatch - Method Injection (CVE-2026-33672)
- **Advisory:** #1115549, #1115551
- **CVSS:** 5.3 (Moderate)
- **Module:** picomatch@2.3.1, picomatch@4.0.3
- **Impact:** Incorrect glob matching
- **Fix:** Upgrade to picomatch@2.3.2+ or 4.0.4+
- **Priority:** P3 - Low (dev dependencies)

#### 16. follow-redirects - Header Leakage
- **Advisory:** #1116560
- **CVSS:** Not scored (Moderate)
- **Module:** follow-redirects@1.15.11
- **Path:** `.>axios>follow-redirects`
- **Impact:** Custom auth headers leak on cross-domain redirect
- **Fix:** Upgrade to follow-redirects@1.16.0+
- **Priority:** P1 - High (via axios upgrade)

#### 17. axios - NO_PROXY Bypass (CVE-2025-62718)
- **Advisory:** #1116673
- **CVSS:** 4.8 (Moderate)
- **Module:** axios@1.13.6
- **Impact:** SSRF via hostname normalization bypass
- **Fix:** Upgrade to axios@1.15.0+
- **Priority:** P1 - High (production dependency)
- **Remediation:** `pnpm update axios@latest`

#### 18. axios - Header Injection Chain (CVE-2026-40175)
- **Advisory:** #1116675
- **CVSS:** 4.8 (Moderate)
- **Module:** axios@1.13.6
- **Impact:** Cloud metadata exfiltration via prototype pollution
- **Fix:** Upgrade to axios@1.15.0+
- **Priority:** P1 - High (production dependency)
- **Remediation:** `pnpm update axios@latest`

#### 19. dompurify - ADD_TAGS Bypass
- **Advisory:** #1116663
- **CVSS:** Not scored (Moderate)
- **Module:** dompurify@3.3.3
- **Impact:** ADD_TAGS function bypasses FORBID_TAGS
- **Fix:** Upgrade to dompurify@3.4.0+
- **Priority:** P2 - Medium
- **Remediation:** `pnpm update dompurify@latest`

### Frontend Moderate (8 issues)

#### 20-21. brace-expansion - Zero-step DoS
- **Advisory:** #1115540, #1115543
- **Module:** brace-expansion@1.1.12, brace-expansion@5.0.4
- **Paths:** eslint, typescript-eslint
- **Impact:** Same as backend #12-13
- **Priority:** P3 - Low (dev dependencies)

#### 22. picomatch - Method Injection
- **Advisory:** #1115551
- **Module:** picomatch@4.0.3
- **Impact:** Same as backend #14-15
- **Priority:** P3 - Low (dev dependency)

#### 23. yaml - Stack Overflow (CVE-2026-33532)
- **Advisory:** #1115555
- **CVSS:** 4.3 (Moderate)
- **Module:** yaml@1.10.2
- **Path:** `.>@emotion/react>@emotion/babel-plugin>babel-plugin-macros>cosmiconfig>yaml`
- **Impact:** RangeError with deeply nested YAML
- **Fix:** Upgrade to yaml@1.10.3+
- **Priority:** P3 - Low (dev dependency)

#### 24. vite - Path Traversal
- **Advisory:** #1116231
- **Module:** vite@8.0.0
- **Impact:** Same as frontend #6
- **Priority:** P1 - High

#### 25. follow-redirects - Header Leakage
- **Advisory:** #1116560
- **Module:** follow-redirects@1.15.11
- **Impact:** Same as backend #16
- **Priority:** P1 - High (via axios)

#### 26-27. axios - NO_PROXY Bypass & Header Injection
- **Advisory:** #1116673, #1116675
- **Module:** axios@1.13.6
- **Impact:** Same as backend #17-18
- **Priority:** P1 - High

---

## 🟢 LOW SEVERITY (1 Issue)

#### 28. cookie - Out of Bounds Characters
- **Advisory:** #1103907
- **Module:** cookie@0.4.0
- **Impact:** Same as backend #11
- **Priority:** P3 - Low

---

## Remediation Strategy

### Phase 1: Critical Production Dependencies (Immediate)

**Timeline:** Complete within 24 hours

1. **Upgrade axios** (Backend + Frontend)
   ```bash
   cd backend && pnpm update axios@latest
   cd frontend && pnpm update axios@latest
   ```
   - Fixes: NO_PROXY bypass, header injection, follow-redirects leakage
   - Impact: 3 moderate severity issues resolved

2. **Upgrade vite** (Frontend)
   ```bash
   cd frontend && pnpm update vite@latest
   ```
   - Fixes: Path traversal, fs.deny bypass, WebSocket file read
   - Impact: 3 high severity dev server issues resolved

3. **Upgrade dompurify** (Backend)
   ```bash
   cd backend && pnpm update dompurify@latest
   ```
   - Fixes: ADD_TAGS bypass
   - Impact: 1 moderate severity issue resolved

### Phase 2: Indirect Production Dependencies (This Week)

**Timeline:** Complete within 7 days

4. **Update Prisma** (Backend)
   ```bash
   cd backend && pnpm update prisma @prisma/client
   ```
   - Should pull in: effect@3.20.0+, defu@6.1.5+
   - Fixes: AsyncLocalStorage contamination, prototype pollution
   - Impact: 2 high severity issues resolved

5. **Update Express** (Backend)
   ```bash
   cd backend && pnpm update express
   ```
   - Should pull in: path-to-regexp@0.1.13+
   - Fixes: ReDoS vulnerability
   - Impact: 1 high severity issue resolved

6. **Update csurf or Replace** (Backend)
   ```bash
   cd backend && pnpm update csurf
   # OR consider replacing with alternative CSRF solution
   ```
   - Fixes: cookie out of bounds characters
   - Impact: 1 low severity issue resolved

### Phase 3: Development Dependencies (Next Sprint)

**Timeline:** Complete within 2 weeks

7. **Update Development Tools**
   ```bash
   # Backend
   cd backend
   pnpm update eslint typescript-eslint nodemon
   
   # Frontend
   cd frontend
   pnpm update eslint typescript-eslint @emotion/react
   ```
   - Fixes: flatted, brace-expansion, picomatch, yaml issues
   - Impact: 10+ dev dependency issues resolved
   - Risk: Low (dev-only dependencies)

---

## Testing Requirements

### After Each Phase

1. **Unit Tests**
   ```bash
   cd backend && pnpm test
   cd frontend && pnpm test
   ```

2. **E2E Tests**
   ```bash
   ./scripts/run-e2e-tests.sh
   ```

3. **Manual Testing**
   - Recipe creation and editing
   - Browse Recipes (Spoonacular API)
   - Meal planning
   - Grocery list generation
   - Authentication flows

4. **Security Verification**
   ```bash
   cd backend && pnpm audit
   cd frontend && pnpm audit
   ```

---

## Risk Assessment

### High Risk Updates
- **axios:** Widely used, test all HTTP requests
- **vite:** Dev server only, but test HMR and build process
- **express:** Core backend framework, thorough testing required

### Medium Risk Updates
- **Prisma:** Database layer, test all queries
- **dompurify:** HTML sanitization, test recipe import

### Low Risk Updates
- **Dev dependencies:** No production impact
- **Indirect dependencies:** Pulled in automatically

---

## Rollback Plan

For each phase:
1. Create git branch: `security/phase-N-updates`
2. Commit changes with detailed message
3. Test thoroughly
4. If issues found:
   ```bash
   git checkout main
   git branch -D security/phase-N-updates
   ```
5. Document issues and create targeted fixes

---

## Success Criteria

- [ ] All high severity production issues resolved
- [ ] All moderate severity production issues resolved
- [ ] E2E tests passing
- [ ] Manual testing complete
- [ ] Security audit shows 0 high/critical vulnerabilities
- [ ] Application performance unchanged or improved
- [ ] No breaking changes in user-facing features

---

## GitHub Issues to Create

1. **#92 - [P1][Security] Upgrade axios to 1.15.0+ to fix SSRF and header injection vulnerabilities**
2. **#93 - [P1][Security] Upgrade vite to 8.0.5+ to fix dev server path traversal vulnerabilities**
3. **#94 - [P1][Security] Update Prisma dependencies to fix AsyncLocalStorage and prototype pollution**
4. **#95 - [P2][Security] Update development dependencies to resolve ReDoS and prototype pollution**

---

## Documentation Updates

After completion:
- Update SECURITY.md with resolved vulnerabilities
- Update SETUP.md with new dependency versions
- Create SECURITY_AUDIT_2026-04-21.md with full report
- Update README.md with security badge (if applicable)

---

**Prepared by:** Bob (Software Engineer)  
**Date:** April 21, 2026  
**Next Review:** After Phase 1 completion (24 hours)

---

*This document serves as the official security remediation plan for vulnerabilities identified on April 21, 2026.*