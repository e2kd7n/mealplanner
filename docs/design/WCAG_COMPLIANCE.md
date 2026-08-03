# WCAG 2.1 AA Compliance Documentation

## Overview

This document describes the WCAG 2.1 Level AA accessibility compliance implementation for issue #123.

> **Regenerated 2026-08 (issue #313)** against the current `frontend/src/theme.ts` (post
> Epic #191 Child #2 — the light-theme palette changed since this doc was first written).
> Ratios below were computed with the same relative-luminance formula as
> `frontend/src/utils/contrastChecker.ts`, applied to the theme's actual current hex
> values (note: `contrastChecker.ts`'s own `verifyThemeContrast()` still hardcodes a
> different, older set of colors than `theme.ts` — that's a separate drift worth a
> follow-up issue, tracked outside this doc pass).

## Color Contrast Verification

### WCAG 2.1 Requirements

**Level AA Standards:**
- Normal text (< 18pt): 4.5:1 minimum contrast ratio
- Large text (≥ 18pt or 14pt bold): 3:1 minimum contrast ratio
- UI components and graphics: 3:1 minimum contrast ratio
- Focus indicators: 3:1 minimum contrast ratio

### Theme Color Analysis (Light Mode)

#### Primary Colors
- **Primary Main (#2E7D32 on #FFFFFF)**
  - Contrast Ratio: 5.13:1
  - Status: ✅ PASSES AA (4.5:1 required)
  - Status: ❌ FAILS AAA (7:1 required for normal text)

- **Primary Dark (#1B5E20 on #FFFFFF)**
  - Contrast Ratio: 7.87:1
  - Status: ✅ PASSES AA
  - Status: ✅ PASSES AAA

- **Primary Light (#60A46A on #FFFFFF)**
  - Contrast Ratio: 2.99:1
  - Status: ❌ FAILS AA even for large text (3:1 required)
  - Status: ⚠️ Use only for non-text/decorative elements

#### Secondary Colors
- **Secondary Main (#D4880C on #FFFFFF)**
  - Contrast Ratio: 2.87:1
  - Status: ❌ FAILS AA, including for large text
  - Recommendation: Use secondary.dark for any text usage

- **Secondary Dark (#B36B00 on #FFFFFF)**
  - Contrast Ratio: 4.18:1
  - Status: ⚠️ PASSES AA for large text only (3:1) — FAILS normal text (4.5:1)

- **Secondary Light (#E6A020 on #FFFFFF)**
  - Contrast Ratio: 2.23:1
  - Status: ❌ FAILS AA for normal and large text
  - Status: ⚠️ Decorative / non-text use only

#### Status Colors
- **Error (#D32F2F on #FFFFFF)**
  - Contrast Ratio: 4.98:1
  - Status: ✅ PASSES AA

- **Warning (#D4880C on #FFFFFF)** — same hex as secondary.main in light mode
  - Contrast Ratio: 2.87:1
  - Status: ❌ FAILS AA, including for large text

- **Info (#0277BD on #FFFFFF)**
  - Contrast Ratio: 4.80:1
  - Status: ✅ PASSES AA

- **Success (#2E7D32 on #FFFFFF)** — same hex as primary.main
  - Contrast Ratio: 5.13:1
  - Status: ✅ PASSES AA

#### Background Colors
- **Text on Default Background (#000000 on #F5F5F5)**
  - Contrast Ratio: 19.26:1
  - Status: ✅ PASSES AA
  - Status: ✅ PASSES AAA

- **Text on Paper (#000000 on #FFFFFF)**
  - Contrast Ratio: 21:1
  - Status: ✅ PASSES AA
  - Status: ✅ PASSES AAA

### Theme Color Analysis (Dark Mode, on #121212)

Dark mode uses a separate, lighter palette rather than the light-mode colors inverted —
all three checked pass comfortably:

- **Primary Main (#66BB6A on #121212)** — 7.92:1 — ✅ PASSES AA and AAA
- **Secondary Main (#FFB74D on #121212)** — 10.82:1 — ✅ PASSES AA and AAA
- **Info Main (#4FC3F7 on #121212)** — 9.35:1 — ✅ PASSES AA and AAA

### ⚠️ Action Needed

Unlike the doc's previous revision, several current light-mode colors genuinely fail
AA at their default weight:
- `secondary.main` / `warning.main` (#D4880C) fails even the large-text threshold —
  currently only safe for non-text UI accents, not for any text or icon meant to
  convey meaning on its own.
- `secondary.light` (#E6A020) and `primary.light` (#60A46A) are decorative-only.
- `secondary.dark` (#B36B00) is large-text-safe but not normal-text-safe.

This is a real, current gap — not just a documentation staleness issue — and is worth
its own follow-up issue if these colors are used for user-facing text rather than
purely decorative accents. Grep usages before assuming any given occurrence is safe.

## Implementation

### Contrast Checker Utility

Location: `frontend/src/utils/contrastChecker.ts`

Features:
- Calculate contrast ratios
- Verify WCAG AA compliance
- Verify WCAG AAA compliance
- Theme color verification
- Development logging

Usage:
```typescript
import { meetsWCAG_AA, getContrastRatio } from './utils/contrastChecker';

// Check if colors meet WCAG AA
const result = meetsWCAG_AA('#2E7D32', '#FFFFFF');
console.log(result); // { passes: true, ratio: 5.13, required: 4.5 }

// Get contrast ratio
const ratio = getContrastRatio('#D4880C', '#FFFFFF');
console.log(ratio); // 2.87
```

### Automatic Verification

The contrast checker's `logContrastResults()` runs automatically in development mode
and logs results to the console — **but note `verifyThemeContrast()`'s hardcoded color
list has drifted from `theme.ts` and currently checks different hex values than the
theme actually uses** (e.g. it checks secondary.main against `#C62828`, which appears
nowhere in `theme.ts`). Treat its console output as unreliable until that function is
updated to import from `theme.ts` directly rather than hardcoding its own copies. The
ratios in this document were computed against the theme's real values instead — see
the sections above.

## Recommendations

### Color Usage Guidelines

1. **Primary Colors**
   - ✅ Use primary.main for all text sizes
   - ✅ Use primary.dark for all text sizes
   - ❌ Do not use primary.light for text — decorative/non-text only

2. **Secondary Colors**
   - ❌ Do not use secondary.main for text (fails even large-text AA) — decorative/non-text only
   - ⚠️ Use secondary.dark for large text only, not normal text
   - ❌ Avoid secondary.light for text

3. **Status Colors**
   - ✅ Error, Info, Success: Safe for all text
   - ❌ Warning (#D4880C): fails even large-text AA — do not use for text; use error or secondary.dark instead if a warning needs to be readable as text

4. **Backgrounds**
   - ✅ All background combinations meet AAA standards

### Theme Improvements

The light-mode `secondary`/`warning` colors below AA at their current values. If
stricter compliance is needed, consider adjustments in this range (verify with
`getContrastRatio` before adopting — these are illustrative starting points, not
pre-verified final values):

```typescript
// Example darker secondary/warning direction — verify actual ratio before using
secondary: {
  main: '#B36B00', // current secondary.dark — 4.18:1, large-text AA only
  light: '#D4880C', // current secondary.main — still fails AA, decorative only
  dark: '#8A5400', // darker still — recompute ratio before adopting
}
```

## Testing

### Manual Testing

1. **Lighthouse Audit**
   ```bash
   # Open Chrome DevTools
   # Run Lighthouse audit
   # Check Accessibility score
   ```

2. **axe DevTools**
   ```bash
   # Install axe DevTools extension
   # Run automated scan
   # Review color contrast issues
   ```

3. **WAVE Tool**
   ```bash
   # Visit https://wave.webaim.org/
   # Enter application URL
   # Review contrast errors
   ```

### Color Blindness Testing

Test with simulators:
- Protanopia (red-blind)
- Deuteranopia (green-blind)
- Tritanopia (blue-blind)
- Achromatopsia (total color blindness)

Tools:
- Chrome DevTools > Rendering > Emulate vision deficiencies
- Colorblind Web Page Filter
- Sim Daltonism (macOS)

### Zoom Testing

Test at various zoom levels:
- 100% (baseline)
- 200% (WCAG requirement)
- 400% (extreme case)

Verify:
- Text remains readable
- Layout doesn't break
- No horizontal scrolling
- Focus indicators visible

## Compliance Checklist

### Completed ✅

- [x] Color contrast ratios calculated
- [x] Theme colors verified against WCAG AA
- [x] Contrast checker utility created
- [x] Development logging implemented
- [x] Documentation created
- [x] Usage guidelines provided
- [x] Recommendations for improvements

### Testing Required 🧪

- [ ] Run Lighthouse accessibility audit
- [ ] Run axe DevTools scan
- [ ] Test with WAVE tool
- [ ] Test with color blindness simulators
- [ ] Test at 200% zoom
- [ ] Test focus indicators
- [ ] Manual review of all pages

### Future Enhancements ⏳

- [ ] High contrast mode toggle
- [ ] User preference for color themes
- [ ] Automated contrast testing in CI
- [ ] Visual regression testing
- [ ] Accessibility testing in E2E tests

## WCAG 2.1 AA Compliance Status

### Color Contrast (1.4.3)
- Status: ⚠️ PARTIAL — primary/error/info/success text colors meet 4.5:1, but the
  current `secondary`/`warning` palette (#D4880C family) does not, per the
  re-verified table above
- Notes: Confirm no user-facing text or meaningful icon relies on secondary.main,
  secondary.light, or warning.main as its sole color signal
- Action: Either restrict those colors to decorative/non-text use, or adjust the
  palette (see Theme Improvements above) and re-run this check

### Focus Visible (2.4.7)
- Status: ✅ COMPLIANT (Material-UI default)
- Notes: Focus indicators have 3:1 contrast
- Action: Verify in manual testing

### Text Spacing (1.4.12)
- Status: ✅ COMPLIANT
- Notes: Typography allows user adjustments
- Action: Test at 200% zoom

### Content on Hover or Focus (1.4.13)
- Status: ✅ COMPLIANT
- Notes: Tooltips and popovers are dismissible
- Action: Verify in manual testing

## Browser Support

Accessibility features work on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Related Files

- `frontend/src/theme.ts` - Theme configuration
- `frontend/src/utils/contrastChecker.ts` - Contrast verification
- `frontend/src/main.tsx` - Development logging

## Issue Status

**Issue #123: [P2][A11Y] Verify Color Contrast and WCAG Compliance**

Status: ⚠️ Re-opened by re-verification (issue #313, 2026-08) — original "Complete"
status was based on ratios for a color palette the theme no longer uses.

Completed:
- ✅ Contrast checker utility created (`getContrastRatio`/`meetsWCAG_AA` — the
  functions themselves are correct; only `verifyThemeContrast()`'s hardcoded
  color list has drifted from `theme.ts`)
- ✅ Development logging implemented
- ✅ Documentation regenerated against current theme (this pass)
- ✅ Usage guidelines updated

Still needed:
- ⚠️ Decide whether `secondary`/`warning` (#D4880C family) need a palette
  adjustment, or a policy that they're decorative-only
- ⚠️ Update `verifyThemeContrast()` in `contrastChecker.ts` to read from
  `theme.ts` instead of its own hardcoded (and now-wrong) color copies
- 🧪 Lighthouse audit (manual)
- 🧪 axe DevTools scan (manual)
- 🧪 Color blindness testing (manual)
- 🧪 Zoom testing (manual)

The application's primary/error/info/success colors meet WCAG 2.1 Level AA for color
contrast. The secondary/warning palette currently does not, and needs either a
palette change or a decorative-only usage policy — see "Action Needed" above.

## Made with Bob