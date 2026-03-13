# Phase 7: Recipe Detail + Signal Logging - Research

**Researched:** 2026-03-13
**Domain:** Overlay UI, motion animations, signal logging, recipe data extraction, haptic feedback
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Overlay behavior & dismissal
- Almost-full-screen slide-up — leaves a sliver of the discovery card peeking at the top
- Opaque background (no dimmed backdrop behind the overlay)
- Dismissible via both back arrow (top-left, per mockup) AND swipe-down gesture
- Native scroll within the overlay; "Found my pick" CTA stays sticky at bottom

#### Link presentation & missing data
- Full-width cards with icons, matching the mockup style (play icon for YouTube, book icon for web)
- If a recipe has no web recipe URL (extracted from description), show only the YouTube card — no disabled/grayed-out state
- Links open in a new browser tab (on mobile this triggers native app handling — YouTube app, etc.)
- Must show source attribution (channel name or video title) — extract from available data, don't use generic labels

#### "Found my pick" experience
- After tapping: button changes to "Picked ✓" state, user stays on the detail view
- Haptic feedback + color shift on the button for a satisfying delight moment
- User can tap the "Picked" button again to un-pick (toggle behavior)
- Multiple picks allowed per session — user can shortlist several recipes

#### Card-to-detail transition
- Entry: slide up from bottom (standard sheet animation)
- Exit: slide down (reverse of entry)
- Picked recipes show a small badge/checkmark on the discovery card
- Viewed recipes (tapped into detail) show a subtle visual change on the card (slight dim or seen indicator)

### Claude's Discretion

- Slide-up animation timing and spring physics
- Exact haptic feedback implementation (Vibration API availability)
- How to extract web recipe URLs from the description field (regex pattern for common recipe blog URLs)
- Loading/error states within the overlay
- Typography and spacing details beyond the mockup reference
- Which fields to gracefully hide when recipe data is null (e.g., missing cook_time, difficulty)

### Deferred Ideas (OUT OF SCOPE)

- None — discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DETL-01 | Recipe detail slides up as overlay over discovery card (not full page nav) | FilterBottomSheet pattern; motion `animate={{ y }}`; almost-full-screen with peek |
| DETL-02 | Shows food photo with hard border, recipe name, cuisine/diet chips, one-line hook | Recipe schema: thumbnail, recipe_name_english, cuisine_tags, diet_tags, one_line_hook; mockup layout |
| DETL-03 | "Watch on YouTube" button opens YouTube link in new tab | Recipe.url; `target="_blank" rel="noopener noreferrer"`; log youtube_open |
| DETL-04 | "Full Recipe" button opens web link in new tab | Recipe.web_recipe_link or extract from description; same link pattern; log web_open |
| DETL-05 | "Found my pick" CTA logs found_my_pick, shows toast, changes button to "Picked" | logInteraction; toggle state; minimal toast; haptic optional |
| DETL-06 | Back arrow returns to discovery at same card position | Controlled overlay state; no route change; currentIndex preserved |
| DETL-07 | Recipe detail layout matches editorial design mockup | stitch_screens/5_recipe_detail_editorial.html reference |
| LOGG-01 | All user interactions logged silently to user_interactions table | interaction-logger.ts exists; logInteraction(sessionId, action, recipeId?) |
| LOGG-02 | Actions: swipe_next, swipe_prev, tap, youtube_open, web_open, found_my_pick, back_no_action, shuffle | ALLOWED_ACTIONS in interaction-logger; wire at call sites |
| LOGG-03 | Logging is fire-and-forget (no await, no UI feedback) | `.then()` pattern; no await; no blocking |
| LOGG-04 | Each log includes session_id, recipe_id, action, timestamp, metadata | Supabase insert; timestamp defaults to now(); metadata optional |

</phase_requirements>

## Summary

Phase 7 builds the recipe detail overlay and wires signal logging across the discovery flow. The overlay is an almost-full-screen slide-up sheet (no dimmed backdrop) with back arrow and swipe-down dismissal. The existing `interaction-logger.ts` already supports all required actions with fire-and-forget semantics. The `FilterBottomSheet` provides a proven pattern for slide-up with `animate={{ y: open ? 0 : '100%' }}` and motion transitions.

**Critical dependency:** `session_id` must be set for logging to work. The session store has `setSessionId` but nothing calls it. Phase 8 creates full session management. **Recommendation:** In `startSession` (or on first discovery render), if `sessionId` is empty, generate `crypto.randomUUID()` and call `setSessionId`. This satisfies LOGG-04 without requiring Phase 8.

**Primary recommendation:** Use the FilterBottomSheet pattern for the overlay (motion.div with `animate={{ y }}`), add `drag="y"` with `onDragEnd` for swipe-down dismiss, extend session store with `pickedIds: string[]` and `viewedIds: string[]` for card badges, and wire `logInteraction` at every interaction point (swipe, tap, link opens, picks, back, shuffle).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| motion | ^12.36.0 | Overlay animations, drag gesture, spring physics | Already in project; FilterBottomSheet uses it; drag supports swipe-down |
| @supabase/supabase-js | ^2.99.1 | Interaction inserts | Already configured; interaction-logger uses it |
| zustand | ^5.0.11 | Session state, pickedIds, viewedIds | Already in project; extend session store |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | Toast for "Found my pick" | Minimal: fixed-position div with motion fade; no new dependency |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| motion drag | react-aria Sheet | React Aria has gesture-driven sheet; motion already in project |

**Installation:** No new packages required for Phase 7.

## Architecture Patterns

### Recommended Project Structure

```
components/
├── discovery/
│   ├── DiscoveryCard.tsx         # Add picked/viewed badges
│   ├── DiscoveryCardStack.tsx    # Wire logInteraction for swipe
│   ├── RecipeDetailOverlay.tsx   # NEW: full overlay component
│   └── FilterBar.tsx             # Wire logInteraction for shuffle
app/
├── page.tsx                      # Overlay state, selectedRecipe; wire tap
stores/
├── session-store.ts              # Add pickedIds, viewedIds, togglePick; ensure sessionId
services/
├── interaction-logger.ts         # Already exists; all actions supported
lib/
├── utils/
│   └── recipe-urls.ts            # NEW: extractWebRecipeUrl, getYouTubeAttribution, getWebAttribution
```

### Pattern 1: Slide-up overlay with swipe-down dismiss

**What:** Almost-full-screen sheet that slides up from bottom, leaves a peek of the card, dismisses via back arrow or swipe-down.

**When to use:** Recipe detail overlay per CONTEXT.

**Example:**

```typescript
// From FilterBottomSheet + motion React Gestures pattern
<motion.div
  className="fixed bottom-0 left-0 right-0 z-50 bg-bg-light rounded-t-2xl border-t-2 border-charcoal"
  initial={false}
  animate={{ y: open ? 0 : '100%' }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
  drag={open ? 'y' : false}
  dragConstraints={{ top: 0 }}
  dragElastic={0.2}
  onDragEnd={(_, info) => {
    if (info.offset.y > 100 || info.velocity.y > 500) onClose()
  }}
>
  {/* content */}
</motion.div>
```

**Peek:** Use `top: 48` or `height: calc(100dvh - 48px)` so card peeks at top. Opaque background: no backdrop div.

### Pattern 2: Fire-and-forget logging

**What:** Call `logInteraction` without await; logging must not block UI.

**When to use:** Every user interaction (swipe, tap, link open, pick, back, shuffle).

**Example:**

```typescript
// From services/interaction-logger.ts
logInteraction(sessionId, 'tap', recipe.id)
logInteraction(sessionId, 'youtube_open', recipe.id)
logInteraction(sessionId, 'found_my_pick', recipe.id, { picked: true })
```

**Session ID:** Guard: `if (sessionId.length < 8) return`. Ensure `sessionId` is set in `startSession` or on first discovery load.

### Pattern 3: Source attribution from recipe data

**What:** YouTube: use `recipe.title` (video title) or parse description for channel. Web: use `web_recipe_link` domain (e.g. hebbarskitchen.com → "Hebbar's Kitchen") or extract from description.

**When to use:** Link cards display; "YouTube / Kunal Kapur" style, not "Watch Video".

**Example:**

```typescript
// YouTube: recipe.title or fallback "YouTube"
const youtubeLabel = recipe.title ? `YouTube / ${recipe.title}` : 'YouTube'

// Web: extract domain from web_recipe_link or description
function getWebAttribution(recipe: Recipe): string {
  const url = recipe.web_recipe_link ?? extractWebRecipeUrl(recipe.description)
  if (!url) return ''
  try {
    const host = new URL(url).hostname.replace('www.', '')
    const known: Record<string, string> = {
      'hebbarskitchen.com': "Hebbar's Kitchen",
      'archanaskitchen.com': "Archana's Kitchen",
    }
    return known[host] ?? host.replace('.com', '')
  } catch {
    return ''
  }
}
```

### Anti-Patterns to Avoid

- **Dimmed backdrop:** CONTEXT says opaque background, no dimmed backdrop. Do not add `bg-charcoal/30` behind overlay.
- **Await on logInteraction:** Logging is fire-and-forget. Never `await logInteraction(...)`.
- **Blocking on session_id:** If sessionId empty, generate UUID in startSession; don't block overlay or logging.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|--------|-------------|--------------|-----|
| Slide-up sheet | Custom CSS animation | motion.div with animate={{ y }} | Spring physics, gesture support |
| Swipe-down dismiss | Custom touch handlers | motion drag="y" + onDragEnd | Velocity-based threshold; consistent with DiscoveryCardStack |
| URL extraction | Complex NLP | Regex for common domains: hebbarskitchen.com, archanaskitchen.com, etc. | Description may contain URLs; regex is sufficient for known sources |
| Toast | Full toast library | Fixed div + motion fade in/out | DETL-05 says "shows toast"; minimal implementation suffices |

**Key insight:** Motion already provides drag and spring; FilterBottomSheet proves the pattern. No new animation libraries.

## Common Pitfalls

### Pitfall 1: Session ID empty, logging silently skipped

**What goes wrong:** All `logInteraction` calls return early because `sessionId.length < 8`.

**Why it happens:** `setSessionId` exists but is never called. Phase 8 creates session UUID but runs after Phase 7.

**How to avoid:** In `startSession` (or on first discovery render when `setupComplete` is true), if `sessionId` is empty, generate `crypto.randomUUID()` and call `setSessionId(id)`. Persist via existing `partialize`.

**Warning signs:** No rows in user_interactions after testing.

### Pitfall 2: Scroll conflict with swipe-down

**What goes wrong:** User scrolls overlay content; drag gesture triggers dismiss.

**Why it happens:** `drag="y"` on the sheet captures vertical movement; scroll inside also moves vertically.

**How to avoid:** Use `dragListener` on a drag handle only (small bar at top), or use `dragConstraints` and `onDragEnd` with velocity threshold so small scrolls don't dismiss. Alternative: put drag on a narrow top strip; scrollable content below does not have drag.

**Warning signs:** Overlay dismisses when user scrolls down to read.

### Pitfall 3: Vibration API not supported (Safari)

**What goes wrong:** `navigator.vibrate()` returns false or throws on Safari/iOS.

**Why it happens:** Vibration API is not supported on Safari (all versions). Firefox removed it in v129.

**How to avoid:** Feature-detect: `if ('vibrate' in navigator) { navigator.vibrate(10) }`. Fail silently. No UI feedback for missing haptic; button color shift is the primary delight.

**Warning signs:** Console errors on iOS Safari.

### Pitfall 4: Links open in same tab (loses app)

**What goes wrong:** User taps YouTube link; app navigates away or closes.

**Why it happens:** Missing `target="_blank" rel="noopener noreferrer"`.

**How to avoid:** All external links: `<a href={url} target="_blank" rel="noopener noreferrer">`. On mobile, `target="_blank"` triggers native app (YouTube app) when available.

**Warning signs:** User taps link and app disappears.

## Code Examples

### Recipe URL extraction (when web_recipe_link is null)

```typescript
// lib/utils/recipe-urls.ts
const RECIPE_DOMAIN_PATTERN = /https?:\/\/(?:www\.)?(hebbarskitchen\.com|archanaskitchen\.com|sanjeevkapoor\.com)[^\s"')]*/gi

export function extractWebRecipeUrl(description: string | null): string | null {
  if (!description) return null
  const match = description.match(RECIPE_DOMAIN_PATTERN)
  return match ? match[0] : null
}
```

### Haptic feedback (optional, graceful fallback)

```typescript
export function triggerHaptic() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(10)
    } catch {
      // ignore
    }
  }
}
```

### Sticky CTA with gradient fade (from mockup)

```tsx
<div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-light via-bg-light to-transparent">
  <button className="w-full bg-primary py-5 border-2 border-charcoal text-white font-display font-black text-xl uppercase tracking-widest rounded-xl">
    Found my pick
  </button>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|-------------|------------------|--------------|--------|
| framer-motion | motion (v12) | Package rename | Import from `motion/react` |
| Full backdrop | Opaque overlay only | CONTEXT decision | No dimmed backdrop behind sheet |

**Deprecated/outdated:**
- `framer-motion` package: use `motion` (same maintainer, renamed package)

## Open Questions

1. **Session ID initialization**
   - What we know: Phase 8 creates session UUID; Phase 7 runs first. `setSessionId` exists but is never called.
   - What's unclear: Whether to add session_id generation in Phase 7 or defer logging until Phase 8.
   - Recommendation: Add session_id generation in `startSession`: if `sessionId` is empty, generate UUID and set. Persist via existing `partialize`. Unblocks Phase 7 logging.

2. **Source attribution for YouTube**
   - What we know: Recipe has `title`, `description`, `url`. No `channel_name` field.
   - What's unclear: Whether `title` is video title or channel. Description may contain "From X" or channel info.
   - Recommendation: Use `recipe.title` as primary label; fallback "YouTube" if null. If description has known patterns (e.g. "Recipe from Hebbar's Kitchen"), extract and use.

3. **Toast for "Found my pick"**
   - What we know: DETL-05 requires "shows toast". Button change is primary feedback.
   - What's unclear: Toast duration, position, exact message.
   - Recommendation: "Added to shortlist" or "Picked!" — fixed bottom above CTA, 2s duration, motion fade. No new library.

## Sources

### Primary (HIGH confidence)
- Project: `services/interaction-logger.ts`, `components/discovery/FilterBottomSheet.tsx`, `lib/types/database.types.ts`
- Mockup: `stitch_screens/5_recipe_detail_editorial.html`
- Motion docs: https://motion.dev/docs/react-gestures

### Secondary (MEDIUM confidence)
- Vibration API: MDN, Can I use — Safari not supported; recommend feature-detect
- Swipe-down sheet: React Aria gesture-driven sheet pattern; motion drag equivalent

### Tertiary (LOW confidence)
- Web recipe URL regex: Hebbars Kitchen domain known; other Indian recipe blogs may vary

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — motion, Supabase, Zustand already in project
- Architecture: HIGH — FilterBottomSheet pattern proven; interaction-logger exists
- Pitfalls: HIGH — session_id, Vibration API, scroll/drag conflict documented

**Research date:** 2026-03-13
**Valid until:** ~30 days (stable stack)
