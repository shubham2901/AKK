---
phase: 06-discovery-loop
plan: 02
subsystem: discovery
tags: [motion, swipe, spring-physics, recipe-cards, neo-brutalist]

# Dependency graph
requires:
  - phase: 06-discovery-loop
    provides: Loop logic, filterPool, cuisineFilter, mealTypeFilter (from 06-01 store)
provides:
  - Full-screen swipeable recipe cards with spring physics
  - DiscoveryCard (full-bleed photo, neo-brutalist text block)
  - DiscoveryCardStack (Motion drag, direction lock, loop navigation)
affects: [06-03-filter-bar, 07-recipe-detail]

# Tech tracking
tech-stack:
  added: []
  patterns: [Motion drag with useMotionValue, AnimatePresence key=recipe.id, filterPool client-side]

key-files:
  created: [components/discovery/DiscoveryCard.tsx, components/discovery/DiscoveryCardStack.tsx]
  modified: [app/page.tsx]

key-decisions:
  - "Used recipe.id for AnimatePresence key (not index) per 06-RESEARCH Pitfall 2"
  - "Both axes supported: horizontal (right/left) and vertical (up/down) per CONTEXT"
  - "20% screen dimension + velocity 500 threshold for commit"

patterns-established:
  - "DiscoveryCard: full-bleed photo, neo-brutalist text block with Charcoal (not white-on-gradient)"
  - "Swipe: Motion drag + dragDirectionLock + onDragEnd threshold + animate() for exit/snap"

requirements-completed: [DISC-01, DISC-02, DISC-05, DISC-06]

# Metrics
duration: 5min
completed: 2026-03-13
---

# Phase 6 Plan 2: Discovery Card and Stack Summary

**Full-screen swipeable recipe cards with Motion drag, spring physics, and loop navigation — DiscoveryCard (full-bleed photo, neo-brutalist text block) and DiscoveryCardStack (both-axis swipe, ~20% threshold, key=recipe.id)**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-13T10:41:02Z
- **Completed:** 2026-03-13T10:46:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- DiscoveryCard component with full-bleed photo, neo-brutalist text block (Charcoal text, hard border), recipe name, one-line hook, 2-3 cuisine/diet chips
- DiscoveryCardStack with Motion drag on both axes, dragDirectionLock, ~20% threshold, spring physics on commit and snap-back
- Swipe right/up = next card, swipe left/down = previous; loop at edges
- AnimatePresence with key={recipe.id}; touch-none, draggable={false} on img
- Integrated into app page when pool has 5+ recipes

## Task Commits

Each task was committed atomically:

1. **Task 1: DiscoveryCard component** - `d15b949` (feat)
2. **Task 2: DiscoveryCardStack with swipe and spring physics** - `0aa2873` (feat)

**Plan metadata:** `279dc92` (docs: complete plan)

_Note: Session store (loop logic, filterPool, filter state) was already present from 06-01 scope; no store changes needed._

## Files Created/Modified

- `components/discovery/DiscoveryCard.tsx` - Single card: full-bleed photo, neo-brutalist text block, touch-none, draggable={false}
- `components/discovery/DiscoveryCardStack.tsx` - Stack: filterPool, Motion drag, spring physics, loop via nextCard/prevCard
- `app/page.tsx` - Integrated DiscoveryCardStack when pool ready

## Decisions Made

- Used recipe.id for AnimatePresence key (not index) per 06-RESEARCH Pitfall 2
- Both axes supported: horizontal and vertical swipe per CONTEXT
- 20% screen dimension + velocity 500 for commit threshold
- Charcoal text in hard border box (not white-on-gradient) per CONTEXT override

## Deviations from Plan

None - plan executed exactly as written. Session store already had loop logic, filterPool, and filter state (06-01 scope); DiscoveryCardStack consumed them as specified.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Discovery cards and swipe behavior complete
- Ready for 06-03 (Filter bar, shuffle, FilterBottomSheet) and Phase 7 (Recipe detail overlay)
- onCardTap prop wired for Phase 7 overlay

## Self-Check: PASSED

- DiscoveryCard.tsx: FOUND
- DiscoveryCardStack.tsx: FOUND
- Commits d15b949, 0aa2873: FOUND

---
*Phase: 06-discovery-loop*
*Completed: 2026-03-13*
