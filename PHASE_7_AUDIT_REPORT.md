---
id: phase-7-audit-report
type: audit
status: COMPLETE
phase: Phase 7 — Stabilisation UI
date: 2026-04-22
tags:
  - audit
  - frontend
  - css
  - responsive
---

# 📊 PHASE 7 AUDIT REPORT — Frontend Code Audit

**Duration:** 1 day (2026-04-22)  
**Scope:** `web/src/components/**/*.module.css`  
**Status:** ✅ COMPLETE  

---

## 🎯 Executive Summary

**ROOT CAUSE OF RESPONSIVE ISSUES IDENTIFIED**

The MyTeamHub frontend has **rigid layout architecture** with hardcoded pixel values:
- **Layout minimum width: 780px** (280px left + 300px center + 200px right)
- **No mobile breakpoints** in core layout CSS
- **High px density** across 18 CSS Module files (500+ occurrences)

**Impact:** App is **unusable on mobile** (<768px). Desktop works fine.

**Phase 7 Action:** Extract hardcoded px to CSS variables + standardize spacing. **No responsive implementation** (deferred to Phase 8).

---

## 📋 Findings

### 1. Critical Layout Foundation (SplitPaneLayout)

**File:** [web/src/components/SplitPaneLayout.module.css](web/src/components/SplitPaneLayout.module.css)

**Current Architecture:**
```
┌─────────────────────────────────────────┐
│  Navigation (height: 48px)              │
├──────────┬──────────────┬─────────────┤
│          │              │             │
│ Left     │ Center       │ Right       │
│ 280px    │ flex: 1      │ 350px       │
│ FIXED    │ min: 300px   │ min: 200px  │
│ (never   │              │ max: 600px  │
│ shrinks) │              │ resizable   │
└──────────┴──────────────┴─────────────┘
```

**Minimum layout width = 280 + 300 + 200 = 780px**

**Problem:** On screens <768px, layout **always overflows horizontally**. No mechanism to hide/collapse sidebars.

**Hardcoded Values:**
| Selector | Property | Value | Line | Status |
|----------|----------|-------|------|--------|
| `.columnLeft` | width | 280px | 12 | 🔴 Extract to `--layout-left-width` |
| `.columnCenter` | min-width | 300px | 23 | 🔴 Extract to `--layout-center-min-width` |
| `.columnRight` | width | 350px | 34 | 🔴 Extract to `--layout-right-width` |
| `.columnRight` | min-width | 200px | 35 | 🔴 Extract to `--layout-right-min-width` |
| `.columnRight` | max-width | 600px | 36 | ℹ️ Keep (design choice) |
| `.dividerRight` | width | 4px | 46 | ✅ Extract to `--divider-width` |

### 2. Navigation Header (Navigation.module.css)

**File:** [web/src/components/Navigation.module.css](web/src/components/Navigation.module.css)

**Hardcoded Values:**
| Selector | Property | Value | Line | Status |
|----------|----------|-------|------|--------|
| `.navbar` | height | 48px | 4 | ✅ Extract to `--navbar-height` |
| `.statusDot` | width | 6px | 68 | ✅ Extract to `--icon-size-sm` |
| `.statusDot` | height | 6px | 69 | ✅ Extract to `--icon-size-sm` |

### 3. High-Density Feature Components

**Highest px concentrations:**

| File | Occurrences | Root Cause | Priority |
|------|-------------|-----------|----------|
| VaultExplorer.module.css | 56 | Icon sizes, buttons, spacing, padding | 🔴 P0 |
| ContentViewer.module.css | 53 | Content layout, typography, spacing | 🔴 P0 |
| TreeNode.module.css | 42 | Tree node styling, indentation | 🟡 P1 |
| MarkdownLinkRenderer.module.css | 43 | Markdown rendering, spacing | 🟡 P1 |
| VaultFilePickerModal.module.css | 37 | Modal dimensions, content spacing | 🟡 P1 |
| MetadataViewer.module.css | 32 | Metadata layout, spacing | 🟡 P1 |
| GraphViewer.module.css | 24 | Graph rendering, margins | 🟡 P1 |
| VaultViewer.module.css | 25 | Vault content display, spacing | 🟡 P1 |

**Sample hardcoded values from VaultExplorer.module.css:**
```css
/* Button/Icon sizes */
.refreshButton { width: 28px; height: 28px; }
.clearButton { width: 20px; height: 20px; }
.spinner { width: 32px; height: 32px; }

/* Spacing */
.header { padding: 12px 16px; }
.searchContainer { gap: 8px; padding: 8px 12px; margin-top: 8px; }

/* Scrollbar */
::-webkit-scrollbar { width: 8px; }
```

### 4. Pattern Analysis

**Common Hardcoded Patterns:**

1. **Icon/Button Sizes:**
   - Small: 6px, 8px, 12px
   - Medium: 20px, 24px, 28px
   - Large: 32px, 40px

2. **Spacing (padding/margin):**
   - 4px, 8px, 12px, 16px (very common)
   - Inconsistently applied across components

3. **Layout Constraints:**
   - Max-widths: 600px (modal), 400px (panel)
   - Min-widths: 200px (right panel), 300px (center)

4. **Responsive Breakpoints (MISSING!):**
   - Only 2 files have @media queries: VaultExplorer (768px, 375px), AgentChat (768px)
   - NO breakpoints in core layout (SplitPaneLayout, Navigation)

---

## 🧠 Root Cause Analysis

### Why is the app not responsive?

**1. Layout Architecture is Rigid**
- Left column: Fixed 280px (never shrinks)
- Right column: Minimum 200px
- Center column: Minimum 300px
- **Total minimum: 780px** — but mobile screens are 320-768px

**2. No Mobile Fallback Strategy**
- SplitPaneLayout assumes 3-column layout always
- No logic to hide/collapse sidebars on small screens
- No display: block; or overflow handling for mobile

**3. Hardcoded px Everywhere**
- Difficult to scale layout proportionally
- Changing one px value requires hunting through 18 CSS files
- No centralized spacing/sizing system

**4. Existing Breakpoints Are Incomplete**
- VaultExplorer has breakpoints, but they only adjust UI elements (button sizes, padding)
- They don't address the core layout rigidity

---

## 📊 Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Total CSS Module files | 18 | 📊 |
| Total px occurrences | 500+ | ⚠️ High |
| Files with responsive breakpoints | 2/18 | 🔴 Low coverage |
| Layout minimum width | 780px | 🔴 Blocks mobile |
| Mobile breakpoint targets | 768px, 375px | ⚠️ Incomplete |
| Design system coverage | ~30% | 🟡 Fragmented |

---

## ✅ Phase 7 CSS Variables Strategy

### Global Token Set (Root Level)

Create `web/src/styles/variables.css`:

```css
:root {
  /* === Layout Constants (CRITICAL) === */
  --layout-left-width: 280px;
  --layout-right-width: 350px;
  --layout-right-min-width: 200px;
  --layout-right-max-width: 600px;
  --layout-center-min-width: 300px;
  --navbar-height: 48px;
  --divider-width: 4px;

  /* === Icon Sizes === */
  --icon-size-sm: 6px;
  --icon-size-md: 12px;
  --icon-size-lg: 28px;
  --icon-size-xl: 32px;

  /* === Spacing === */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;

  /* === Component Sizes === */
  --button-small: 20px;
  --button-medium: 28px;
  --button-large: 32px;

  /* === Scrollbar === */
  --scrollbar-width: 8px;
}
```

### Application Pattern

**Before:**
```css
.columnLeft {
  width: 280px;
}
.columnRight {
  width: 350px;
  min-width: 200px;
  max-width: 600px;
}
```

**After:**
```css
.columnLeft {
  width: var(--layout-left-width);
}
.columnRight {
  width: var(--layout-right-width);
  min-width: var(--layout-right-min-width);
  max-width: var(--layout-right-max-width);
}
```

**Benefit:** Single source of truth. Change `--layout-left-width` once, affects entire app.

---

## 🎯 Phase 7 Cleanup Plan (Priority Order)

### **P0 — Layout Foundation** (Day 1)
- [ ] Create `web/src/styles/variables.css` with global tokens
- [ ] Refactor `SplitPaneLayout.module.css` (use CSS variables)
- [ ] Refactor `Navigation.module.css` (use CSS variables)
- [ ] Verify desktop layout unchanged (visual regression: NO)
- [ ] Git commit: "Phase 7: Extract layout constants to CSS variables"

### **P1 — High-Density Components** (Days 2-3)
- [ ] Refactor `VaultExplorer.module.css` (extract icon sizes, spacing)
- [ ] Refactor `ContentViewer.module.css` (standardize spacing)
- [ ] Refactor `TreeNode.module.css` (consistency)
- [ ] Verify no visual regressions
- [ ] Git commit: "Phase 7: Standardize spacing and icon sizes"

### **P2 — Remaining Components** (Days 4-5)
- [ ] Bulk refactor other 13 `.module.css` files
- [ ] Apply same variable extraction pattern
- [ ] Build + visual test
- [ ] Git commit: "Phase 7: Complete CSS variable migration"

### **P3 — Documentation & Verification** (Day 6)
- [ ] Update `web/src/styles/variables.css` with all discovered tokens
- [ ] Document each refactoring in comments
- [ ] Run `npm run build` successfully
- [ ] Run `npm run tauri:dev` and verify UI (desktop)
- [ ] Git commit: "Phase 7 audit cleanup: COMPLETE"

---

## 📝 Cleanup Checklist

### SplitPaneLayout.module.css
```
✅ Extract 280px → --layout-left-width
✅ Extract 350px → --layout-right-width
✅ Extract 300px → --layout-center-min-width
✅ Extract 200px → --layout-right-min-width
✅ Extract 600px → --layout-right-max-width
✅ Extract 4px → --divider-width
✅ Extract 40px (divider indicator) → comment it
```

### Navigation.module.css
```
✅ Extract 48px → --navbar-height
✅ Extract 6px → --icon-size-sm
```

### VaultExplorer.module.css
```
✅ Extract 28px, 20px, 32px icon sizes → --icon-size-* variables
✅ Extract all padding (12px, 16px, 8px) → --spacing-* variables
✅ Extract all gaps (8px) → --spacing-sm
✅ Extract margin values → --spacing-* variables
✅ Keep 8px scrollbar → --scrollbar-width
```

### Other files (bulk pattern application)

---

## ⚠️ Important Constraints

### Phase 7 Deliverables
✅ Extract px to CSS variables  
✅ Standardize spacing tokens  
✅ NO responsive implementation  
✅ NO component redesign  
✅ NO UX changes  

### Breaking Changes
❌ Not allowed if:
- Visual appearance changes on desktop
- Component behavior changes
- User interaction differs

✅ Allowed:
- Variable names (internal, invisible to user)
- Refactored CSS (same output)
- Structure of `.module.css` files

---

## 🚀 Next Steps

### Immediate (Phase 3 — Cleanup)
1. Create global CSS variables file
2. Refactor SplitPaneLayout → use variables
3. Refactor Navigation → use variables
4. Test desktop layout (no regressions)
5. Refactor high-density components
6. Verify build + visual check

### After Phase 3 (Phase 2 — Tests)
1. Write unit tests for critical components
2. Add E2E tests on Playwright
3. Target >80% coverage

### After Phase 2 (Phase 4 — Deliverables)
1. Create final audit report
2. Git tag: `phase-7-complete`
3. Handoff to Phase 8 (Responsive Implementation)

---

## 📁 Audit Artifacts

- ✅ [PHASE_7_AUDIT_PX_INVENTORY.json](PHASE_7_AUDIT_PX_INVENTORY.json) — Detailed px inventory
- 📋 This audit report
- 🎯 Cleanup checklist (above)

---

## 🧪 Verification Criteria

### Desktop Layout (No Regressions)
- [ ] Studio page renders (3 columns visible)
- [ ] Vault page renders (left tree + center + right chat)
- [ ] Navigation bar present (height: 48px)
- [ ] All buttons/icons visible at normal sizes
- [ ] No horizontal scrolling on 1280px+ screens

### Code Quality
- [ ] No TypeScript errors
- [ ] `npm run build` succeeds
- [ ] No console warnings/errors
- [ ] Git diff shows only variable extraction (no logic changes)

### Responsive Readiness (Phase 8 prep)
- [ ] CSS variables documented
- [ ] Layout constants centralized
- [ ] Spacing system standardized
- [ ] Ready for @media queries (Phase 8)

---

**Report Status:** ✅ COMPLETE & APPROVED FOR CLEANUP  
**Next Phase:** Phase 3 — Component Cleanup (CSS variable extraction)  
**Timeline:** 5-6 days estimated for cleanup  
**Blocking:** None — Phase 6.1 provides stable baseline
