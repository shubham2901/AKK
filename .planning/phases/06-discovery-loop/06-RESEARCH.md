# Phase 6: Discovery Loop - Research

**Researched:** 2026-03-13
**Domain:** Swipeable card stack, Motion gestures, client-side filtering, bottom sheet UI
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Card layout:** Full-bleed photo; neo-brutalist text block at bottom (hard border, Charcoal text); recipe name (Syne heading), one-line hook, 2-3 cuisine/diet chips; one card visible at a time
- **Swipe:** Both directions — right/up = next, left/down = previous; loop on edges; spring physics (playful); ~20% screen width threshold
- **Filter bar:** Client-side filtering; cuisine + meal type; filter icon opens bottom sheet; active filters as filled chips
- **Chrome:** Shuffle + filter icons floating; no header bar; tap on card opens Recipe Detail (Phase 7)

### Claude's Discretion
- Exact spring stiffness/damping values for swipe
- Filter bottom sheet layout and animation
- Chip colors and styling within neo-brutalist system
- How shuffle icon looks (Material Symbol choice)
- Exact positioning of floating controls (padding, z-index)

### Deferred Ideas (OUT OF SCOPE)
- Ingredient filter
- Diet filter in filter bar
- Card position indicator
- Pagination / load-more on scroll

</user_constraints>

## Summary

Phase 6 implements the core discovery loop: full-screen swipeable recipe cards with spring physics, loop navigation, shuffle, and filter controls. The stack uses Motion's `drag` gesture with `useMotionValue`, `onDragEnd`, and `animate()` for commit/snap behavior. Client-side filtering narrows the 50-recipe pool by cuisine and meal type; a bottom sheet opens from a floating filter icon. The session store already provides `pool`, `currentIndex`, `nextCard`, `prevCard`, `shufflePool` — but `nextCard`/`prevCard` currently clamp at edges; loop behavior must be added.

**Primary recommendation:** Use Motion's `drag` + `onDragEnd` with offset/velocity threshold (~20% screen width) to commit swipes. Use `animate(x, target, { type: 'spring', ... })` for programmatic exit/snap. Build a hand-rolled bottom sheet with `motion.div` and `translateY` — no new dependencies. Extend session store with loop logic for `nextCard`/`prevCard`.

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DISC-01 | Full-screen recipe card with food photo, recipe name (Syne), cuisine/diet chips, one-line hook | Recipe type has `thumbnail`, `recipe_name_english`/`title`, `cuisine_tags`, `diet_tags`, `one_line_hook`; use `font-heading` (Sour Gummy per layout); neo-brutalist text block per design tokens |
| DISC-02 | Swipe right/up for next, left/down for previous | Motion `drag` with `dragDirectionLock`; `onDragEnd` with offset/velocity; commit on threshold; map direction to `nextCard`/`prevCard` |
| DISC-03 | Tap anywhere on card opens Recipe Detail overlay | `onClick` on card; Phase 7 overlay placeholder for now |
| DISC-04 | Shuffle button re-randomizes pool and resets position to 0 | `shufflePool()` already exists; wire to floating button |
| DISC-05 | Card swipe uses spring physics | `dragTransition` with `bounceStiffness`/`bounceDamping`; `animate()` with `type: 'spring'` for exit |
| DISC-06 | Card layout matches immersive design mockup | Full-bleed photo; neo-brutalist text block (2px border, Charcoal text); reference `stitch_screens/3_recipe_card_immersive.html` |
| DISC-07 | Filter bar with cuisine / meal type bottom sheet | Client-side filter on `cuisine_tags` and `meal_type`; bottom sheet from filter icon; note: ingredient filter deferred per CONTEXT |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| motion | ^12.36.0 | Drag gestures, spring physics, AnimatePresence | Already installed; `drag`, `onDragEnd`, `useMotionValue`, `animate`; official docs |
| zustand | ^5.0.11 | Pool, currentIndex, nextCard, prevCard, shufflePool | Already installed; session store provides all actions |
| Tailwind CSS | ^4 | Design tokens, layout | Already installed; `--color-charcoal`, `--font-heading`, `--shadow-*` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | Bottom sheet | Hand-roll with `motion.div` + `translateY`; no new deps |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Motion drag | Swiper.js | 80KB; overkill for single-card stack; Motion already in stack |
| Hand-rolled bottom sheet | react-modal-sheet, @gorhom/bottom-sheet | Adds deps; @gorhom is RN-focused; hand-roll keeps stack minimal |
| useMotionValue + animate | CSS-only | No spring physics, no velocity-based commit |

**Installation:** No new packages. Motion and Zustand already installed.

## Architecture Patterns

### Recommended Project Structure

```
components/
├── discovery/
│   ├── DiscoveryCardStack.tsx   # Stack container, renders single visible card
│   ├── DiscoveryCard.tsx        # Single card: drag, photo, text block
│   ├── FilterBar.tsx            # Floating shuffle + filter icons
│   └── FilterBottomSheet.tsx    # Bottom sheet with cuisine + meal type options
app/
└── page.tsx                     # Orchestrator; replaces placeholder with DiscoveryCardStack
stores/
└── session-store.ts             # Add loop logic to nextCard/prevCard; add filter state
```

### Pattern 1: Swipe Card with Commit Threshold

**What:** Use `useMotionValue(0)` for x (and optionally y). Bind to `style={{ x }}`. On `onDragEnd`, check `info.offset.x` and `info.velocity.x` against threshold. If committed, call `animate(x, exitX, { type: 'spring', ... })` then update index; else `animate(x, 0, { type: 'spring' })` to snap back.

**When to use:** Single-card-at-a-time stack with directional swipe.

**Example:**

```typescript
// Source: motion.dev/docs/react-drag, chris-berry.com Tinder-style pattern
import { motion, useMotionValue, animate } from 'motion/react'

const SWIPE_THRESHOLD = 0.2 * window.innerWidth // ~20% of screen

function Card({ onSwipeLeft, onSwipeRight }) {
  const x = useMotionValue(0)

  function onDragEnd(_, info) {
    const offset = info.offset.x
    const velocity = info.velocity.x
    const committed = Math.abs(offset) > SWIPE_THRESHOLD || Math.abs(velocity) > 500
    if (committed && offset > 0) {
      animate(x, 400, { type: 'spring', stiffness: 300, damping: 30 })
        .then(() => { onSwipeRight(); x.set(0) })
    } else if (committed && offset < 0) {
      animate(x, -400, { type: 'spring', stiffness: 300, damping: 30 })
        .then(() => { onSwipeLeft(); x.set(0) })
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 40 })
    }
  }

  return (
    <motion.div
      drag="x"
      dragElastic={0.2}
      style={{ x }}
      onDragEnd={onDragEnd}
      dragConstraints={{ left: 0, right: 0 }}
      className="touch-none"
    />
  )
}
```

### Pattern 2: Loop Navigation in Store

**What:** Modify `nextCard` and `prevCard` to wrap at edges instead of clamping.

**When to use:** Discovery loop per CONTEXT.

**Example:**

```typescript
// session-store.ts — extend existing nextCard/prevCard
nextCard: () =>
  set((s) => {
    const len = s.session.pool.length
    if (len === 0) return { session: { ...s.session, lastActiveAt: Date.now() } }
    const next = s.session.currentIndex === len - 1 ? 0 : s.session.currentIndex + 1
    return { session: { ...s.session, currentIndex: next, lastActiveAt: Date.now() } }
  }),
prevCard: () =>
  set((s) => {
    const len = s.session.pool.length
    if (len === 0) return { session: { ...s.session, lastActiveAt: Date.now() } }
    const prev = s.session.currentIndex === 0 ? len - 1 : s.session.currentIndex - 1
    return { session: { ...s.session, currentIndex: prev, lastActiveAt: Date.now() } }
  }),
```

### Pattern 3: Client-Side Filter

**What:** Derive `filteredPool` from `session.pool` using `cuisineFilter` and `mealTypeFilter` (arrays). Filter: `recipe.cuisine_tags?.some(c => cuisineFilter.includes(c))` and `recipe.meal_type?.some(m => mealTypeFilter.includes(m))`. Empty filter = no constraint.

**When to use:** Filter bar per CONTEXT (client-side only).

### Anti-Patterns to Avoid

- **Index as AnimatePresence key:** Use `key={recipe.id}` so exit animations work when card changes.
- **No touch-action on draggable:** Add `touch-action: none` (or `className="touch-none"`) to prevent scroll hijacking on mobile.
- **Drag on images without draggable={false}:** Set `draggable={false}` on `<img>` to avoid browser ghost image.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Spring physics for swipe | Custom easing/RAF | Motion `animate(x, target, { type: 'spring' })` | Edge cases, velocity handling |
| Drag gesture + velocity | Manual touch events | Motion `drag` + `onDragEnd` info | Touch/pointer normalization |
| Exit animation on card change | CSS transition | AnimatePresence + motion | Proper unmount sequencing |

**Key insight:** Motion already handles pointer/touch normalization, velocity, and spring physics. Hand-rolling would duplicate complexity and miss mobile edge cases.

## Common Pitfalls

### Pitfall 1: Framer Motion Drag on Mobile (from PITFALLS.md)

**What goes wrong:** Drag feels laggy on mobile Safari; vertical scroll triggers horizontal drag; sticky swipes.

**Why it happens:** Missing `touch-action`; no gesture threshold.

**How to avoid:** Add `touch-action: none` (Tailwind `touch-none`) to draggable card; use offset + velocity threshold in `onDragEnd`; test on real iOS/Android.

**Warning signs:** No `touch-action`; only Chrome DevTools device emulation.

### Pitfall 2: AnimatePresence Key Mismatch (from PITFALLS.md)

**What goes wrong:** Wrong card animates out when swiping; exit animation glitches.

**Why it happens:** Using `key={index}` — when index changes, React reuses DOM and AnimatePresence loses track.

**How to avoid:** Use `key={recipe.id}` so each card has a stable identity.

**Warning signs:** `key={i}` or `key={currentIndex}` in AnimatePresence children.

### Pitfall 3: Image Ghost on Drag

**What goes wrong:** Browser shows default drag ghost when dragging card with image.

**Why it happens:** `<img>` is draggable by default.

**How to avoid:** Add `draggable={false}` to all images inside draggable elements.

### Pitfall 4: Filter State Not Persisted

**What goes wrong:** Filters reset on refresh; user loses selection.

**Why it happens:** Filter state only in component; not in session store.

**How to avoid:** Add `cuisineFilter` and `mealTypeFilter` to session (or preferences) and persist; or accept ephemeral filters for V0 if CONTEXT allows.

## Code Examples

### Drag with Spring Commit

```typescript
// Source: motion.dev/docs/react-drag
<motion.div
  drag="x"
  dragElastic={0.2}
  dragTransition={{ bounceStiffness: 600, bounceDamping: 10 }}
  onDragEnd={(_, info) => {
    const { offset, velocity } = info
    if (Math.abs(offset.x) > 80 || Math.abs(velocity.x) > 500) {
      // commit
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 40 })
    }
  }}
/>
```

### Bottom Sheet (Hand-Rolled)

```typescript
// Source: motion patterns; no external library
const [open, setOpen] = useState(false)

<motion.div
  className="fixed inset-0 z-50 bg-charcoal/0"
  initial={false}
  animate={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
  onClick={() => setOpen(false)}
/>
<motion.div
  className="fixed bottom-0 left-0 right-0 z-50 bg-bg-light rounded-t-2xl border-t-2 border-charcoal"
  initial={{ y: '100%' }}
  animate={{ y: open ? 0 : '100%' }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
  {/* Filter options */}
</motion.div>
```

### Client-Side Filter Logic

```typescript
// Recipe has cuisine_tags: string[] | null, meal_type: string[] | null
function filterPool(
  pool: Recipe[],
  cuisineFilter: string[],
  mealTypeFilter: string[]
): Recipe[] {
  return pool.filter((r) => {
    const matchCuisine =
      cuisineFilter.length === 0 ||
      r.cuisine_tags?.some((c) => cuisineFilter.includes(c))
    const matchMeal =
      mealTypeFilter.length === 0 ||
      r.meal_type?.some((m) => mealTypeFilter.includes(m))
    return matchCuisine && matchMeal
  })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| framer-motion | motion (npm) | Nov 2024 | Same codebase; import from `motion/react` |
| CSS transitions for swipe | Motion drag + spring | — | Velocity-based commit, physics |

**Deprecated/outdated:**
- `framer-motion` package: Prefer `motion` for new code; both resolve to same codebase.

## Open Questions

1. **Bidirectional swipe (right/up vs left/down)**
   - What we know: CONTEXT says right/up = next, left/down = prev. Motion supports `drag` on both axes; `dragDirectionLock` locks to first axis.
   - What's unclear: Whether to support vertical swipe or only horizontal. Mockup shows horizontal chevrons.
   - Recommendation: Start with horizontal only (`drag="x"`); add vertical in a follow-up if needed. Simpler and matches mockup affordance.

2. **Filter persistence**
   - What we know: Session store persists pool, index. Filter state not yet in store.
   - What's unclear: Should cuisine/meal filters persist across refresh?
   - Recommendation: For V0, keep filter state in component; reset on mount. Add to session persist if users request it.

3. **Cuisine/meal type options source**
   - What we know: Recipe has `cuisine_tags[]` and `meal_type[]`. Need distinct values for filter chips.
   - What's unclear: Hardcode common values vs derive from pool.
   - Recommendation: Derive from pool: `[...new Set(pool.flatMap(r => r.cuisine_tags ?? []))]` and same for meal_type. Ensures only relevant options.

## Sources

### Primary (HIGH confidence)
- [Motion React Drag](https://motion.dev/docs/react-drag) — drag, onDragEnd, dragTransition, animate
- [Motion useTransform](https://motion.dev/docs/react-use-transform) — value mapping for card effects
- [Tinder-style swipe (Chris Berry)](https://www.chris-berry.com/garden/tinder-style-swipe-with-framer-motion) — useMotionValue, onDragEnd threshold pattern
- Project: `stores/session-store.ts`, `lib/types/database.types.ts`, `stitch_screens/3_recipe_card_immersive.html`

### Secondary (MEDIUM confidence)
- [Motion Card Stack Tutorial](https://motion.dev/tutorials/react-card-stack) — Motion+ paywall; intro confirms drag, useMotionValue, useTransform, animate
- `.planning/research/PITFALLS.md` — touch-action, AnimatePresence key, image draggable
- `.planning/DESIGN_SYSTEM.md` — spring config stiffness 300, damping 30

### Tertiary (LOW confidence)
- WebSearch: bottom sheet libraries — hand-roll recommended to avoid new deps

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Motion and Zustand verified in package.json and docs
- Architecture: HIGH — patterns from official docs and verified community examples
- Pitfalls: HIGH — PITFALLS.md and Motion docs align

**Research date:** 2026-03-13
**Valid until:** ~30 days (Motion and stack stable)
