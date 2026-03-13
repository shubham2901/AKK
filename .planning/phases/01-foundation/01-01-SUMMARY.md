---
phase: 01-foundation
plan: 01
subsystem: foundation
tags: [nextjs, tailwind, fonts, anti-flash]

# Dependency graph
requires: []
provides:
  - Next.js 15+ app with App Router
  - Tailwind v4 with @import
  - Syne and Plus Jakarta Sans via next/font
  - Inline body background #FFF9F5 (anti-flash)
  - theme-color meta for mobile status bar
affects: [02-data, 03-onboarding]

# Tech tracking
tech-stack:
  added: [next@16, react@19, tailwindcss@4, @tailwindcss/postcss]
  patterns: [next/font for self-hosted fonts, viewport export for theme-color]

key-files:
  created: [app/layout.tsx, app/page.tsx, app/globals.css, package.json, next.config.ts]
  modified: []

key-decisions:
  - "themeColor in viewport export (Next.js 16) not metadata"
  - "Syne weight 800 for headings, Plus Jakarta for body per CONTEXT"

patterns-established:
  - "Inline body backgroundColor for instant anti-flash before CSS loads"
  - "Font variables on html, className on body for next/font"

requirements-completed: [FOUN-01, FOUN-02]

# Metrics
duration: 8min
completed: 2026-03-13
---

# Phase 1 Plan 1: Foundation Bootstrap Summary

**Next.js 16 app with Syne + Plus Jakarta Sans via next/font, inline body background #FFF9F5 to prevent white flash, and theme-color for mobile status bar**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-13T05:20:00Z (approx)
- **Completed:** 2026-03-13T05:28:00Z (approx)
- **Tasks:** 2
- **Files modified:** 17 (created)

## Accomplishments

- Next.js 16 with App Router, TypeScript, Tailwind v4 bootstrapped
- Syne (400, 800) and Plus Jakarta Sans loaded via next/font with display: swap
- Inline body backgroundColor #FFF9F5 prevents white flash before CSS loads
- theme-color meta tag (#FFF9F5) for mobile status bar theming
- Fonts self-hosted from _next/static (no Google CDN)

## Task Commits

Each task was committed atomically:

1. **Task 1: Bootstrap Next.js app** - `cce2587` (feat)
2. **Task 2: Configure root layout — fonts, anti-flash, theme-color** - `25d3e7e` (feat)

**Plan metadata:** `4e721e2` (docs: complete plan)

## Files Created/Modified

- `package.json` - Next.js 16, React 19, Tailwind v4 dependencies
- `app/layout.tsx` - Root layout with Syne/Plus Jakarta fonts, inline bg, viewport themeColor
- `app/page.tsx` - Default Next.js page (unchanged from scaffold)
- `app/globals.css` - Tailwind @import and @theme
- `next.config.ts` - Next.js config
- `postcss.config.mjs` - PostCSS for Tailwind
- `tsconfig.json` - TypeScript config
- `eslint.config.mjs` - ESLint config

## Decisions Made

- **themeColor in viewport export:** Next.js 16 deprecates themeColor in metadata; moved to `export const viewport: Viewport = { themeColor: '#FFF9F5' }`
- **Bootstrap workaround:** create-next-app rejects directory name "AKK" (capital letters); scaffolded in /tmp and copied to project root

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] themeColor moved to viewport export**
- **Found during:** Task 2 (layout configuration)
- **Issue:** Next.js 16 build warned "Unsupported metadata themeColor is configured in metadata export. Please move it to viewport export instead."
- **Fix:** Added `export const viewport: Viewport = { themeColor: '#FFF9F5' }` and removed from metadata
- **Files modified:** app/layout.tsx
- **Verification:** Build passes without warnings; meta theme-color present in HTML
- **Committed in:** 25d3e7e (Task 2 commit)

**2. [Rule 3 - Blocking] create-next-app naming restriction**
- **Found during:** Task 1 (bootstrap)
- **Issue:** "Could not create a project called 'AKK' because of npm naming restrictions: name can no longer contain capital letters"
- **Fix:** Created app in /tmp/akk-next, copied files to project root, ran npm install
- **Files modified:** N/A (workaround, not code change)
- **Verification:** Build succeeds, app runs
- **Committed in:** cce2587 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both necessary for build success and Next.js 16 compatibility. No scope creep.

## Issues Encountered

None - deviations were handled automatically.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- App shell ready with fonts and anti-flash
- Ready for 01-02: Design tokens + branded placeholder page

## Self-Check: PASSED

- SUMMARY.md exists
- Task commits cce2587, 25d3e7e present in git log

---
*Phase: 01-foundation*
*Completed: 2026-03-13*
