# Phase 9: Polish — Research

**Completed:** 2026-03-13

## Scope (from CONTEXT + ROADMAP)

- **EMPT-01–04:** Empty state when **filtered** pool &lt; 5; mockup `stitch_screens/6_empty_state.html`; Reset session filters; Shuffle anyway.
- **SETT-01–04:** Settings from discovery; edit diet + blocklist; persist preferences; pool reflects changes when returning to discovery.

## Current codebase analysis

### Discovery vs “raw” pool

- `session.pool` holds the **fetched** recipe list (up to 50 from `fetchRecipes`).
- `filterPool(pool, cuisineFilter, mealTypeFilter)` in `DiscoveryCardStack` produces **filteredPool** for swiping.
- **`app/page.tsx` currently gates on `pool.length < 5`** for the placeholder message — this is **wrong** for EMPT-01. Empty state must trigger when **`filterPool(...).length < 5`** (after session filters), not when raw pool &lt; 5.

### Filters cleared by “Reset filters”

- Session filters: `cuisineFilter`, `mealTypeFilter`, `ingredientFilter` (store). Filter UI in `FilterBar` / `FilterBottomSheet` only exposes cuisine + meal type today; ingredient may still exist in state from `startSession`.
- **Reset** = clear those three; **not** `preferences.blocklist` or `preferences.diet`.

### Shuffle anyway

- Same semantics as header shuffle: `shufflePool()` on **raw** `session.pool` order; effective cards still pass through `filterPool`. If filtered count stays &lt; 5, user remains on empty state (per CONTEXT).

### Blocklist + fetch

- `lib/supabase/recipes.ts` — **diet only**; comment says blocklist deferred. For Settings changes to matter, **client-side** exclusion after fetch: drop recipes whose `cuisine_tags` intersect `preferences.blocklist` (same mental model as onboarding: user never sees blocked cuisines).

### Settings reuse

- `DietStep` / `BlocklistStep` are onboarding-wizard shaped (steps, “Step 1 of 2”). Phase 9 wants a **single scrollable settings page** reusing **patterns** (cards, chips, CUISINES list) — extract shared presentational pieces or duplicate with simplified chrome (no step headers).

### Navigation

- No router for settings — **local state** in `page.tsx`: `screen: 'discovery' | 'settings'` (or boolean `settingsOpen`). Full-screen settings; **Back** returns to discovery and triggers pool rebuild.

### syncSession

- Optional: after pool rebuild from settings, could call `syncSession` with new preference snapshot — align with Phase 8 pattern (fire-and-forget).

## Risks / notes

| Risk | Mitigation |
|------|------------|
| FilterBar hidden when `pool.length < 5` | Refactor layout so **FilterBar** (and future gear) render whenever user is in discovery with `setupComplete` and data loaded — not only when `pool.length >= 5` |
| Double-fetch on mount | Settings “back” should explicitly refetch + setPool; avoid duplicate effects — use a dedicated `rebuildPoolFromPreferences()` helper called from back handler |

## Plan split

1. **09-01** — Empty state UI, `clearSessionFilters`, fix empty trigger to **filtered** count, show FilterBar on empty branch, wire Reset / Shuffle anyway.
2. **09-02** — Settings screen, gear entry, `filterRecipesByBlocklist` (or inline), pool rebuild on back from settings, requirement traceability for SETT/EMPT.

---

*Phase: 09-polish*
*Research completed: 2026-03-13*
