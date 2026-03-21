# Phase 5: Recipe Pool - Research

**Researched:** 2026-03-13
**Domain:** Supabase recipe fetch, Zustand pool handoff, diet filtering, loading UX
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 1. Filter Behavior (V0)
- **Diet selected** → Apply as Supabase filter:
  - "Vegetarian" → `diet_tags @> '{Vegetarian}'`
  - "Vegan" → `diet_tags @> '{Vegan}'`
  - "Non-Veg" → filter for recipes tagged with meat/fish/egg
- **Diet = null (user skipped onboarding diet step)** → No diet filter, fetch all recipes
- **Blocklist** → Not applied in V0 (deferred to Phase 6 filter bar)
- **Cuisine / ingredient filters** → Not applied in V0 (deferred to Phase 6 filter bar)

#### 2. Fetch Timing & Loading UX
- **Fetch starts when GreetingSplash mounts** — runs in parallel with the 2-sec greeting
- **Initial fetch**: All matching recipes (no pagination for V0 — only 100 recipes in DB)
- **If fetch completes before greeting ends**: Pool ready, discovery renders cards immediately
- **If fetch still pending after greeting**: Show skeleton of recipe cards until data arrives
- **If fetch fails**: Show empty state page with apology ("Sorry, something went wrong")

#### 3. Pool Lifecycle
- **Pool never goes stale** — once fetched, same data stays for the entire session
- **No refetch triggers in V0** — pool is frozen after initial fetch
- **Return within session**: Pool already in Zustand (persisted to localStorage), skip fetch, resume at saved `currentIndex`
- **New session** (after timeout, Phase 8): Pool is cleared and re-fetched

#### 4. Fetch-to-Store Handoff
- `page.tsx` orchestrates the flow (already gates onboarding → greeting → discovery)
- Fetch function lives in `lib/supabase/recipes.ts` — standalone, reusable
- On success: shuffle with Fisher-Yates → `setPool(shuffledRecipes)` into Zustand
- Discovery reads from `session.pool` in Zustand store
- Loading signal: `setupComplete === true && session.pool.length === 0` = still loading
- On refresh: Zustand hydration restores pool from localStorage → no re-fetch needed

#### 5. Data Availability
- 100 recipes seeded in Supabase `recipes` table from `data/recipes_merged.csv` (top 100 by view count)
- All 100 have YouTube thumbnail URLs (`maxresdefault.jpg`)
- Fields available: `recipe_name_english`, `diet_tags`, `cuisine_tags`, `meal_type`, `main_ingredients`, `one_line_hook`, `flavor_profile`, `vibe_tags`, `kid_friendly`, `difficulty`, `thumbnail`, `url`, `web_recipe_link`, `views`, `likes`

### Claude's Discretion

- None specified — all decisions locked in CONTEXT

### Deferred Ideas (OUT OF SCOPE)

- Full diet/blocklist/cuisine/ingredient filtering → Phase 6 (filter bar)
- Pagination (fetch 25-50, then load more on scroll) → Phase 6 (when card stack scrolling exists)
- Pool staleness/refetch logic → Phase 8 (session management)

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| POOL-01 | Recipe pool fetched from Supabase with server-side filters (diet, blocklist, cuisine, ingredient) | V0: diet filter only via `.contains('diet_tags', [diet])`; blocklist/cuisine/ingredient deferred per CONTEXT |
| POOL-02 | Pool randomized on client and order fixed for session duration | Fisher-Yates shuffle in `session-store.ts`; `setPool` with shuffled array; `shufflePool` preserves order |
| POOL-03 | Minimum pool size of 5 recipes; empty state shown if fewer | Empty state handled in Phase 9; Phase 5 must detect fetch result &lt; 5 and surface for empty state |
| POOL-04 | Pool stored in Zustand and survives page refresh within session | `persist` + `partialize` already includes `session`; `session.pool` persisted; `onRehydrateStorage` for hydration gate |

</phase_requirements>

## Summary

Phase 5 fetches recipes from Supabase (filtered by diet when user set one), shuffles them client-side with Fisher-Yates, and stores them in Zustand. The fetch runs in parallel with the 2-second greeting splash. No pagination, blocklist, or cuisine filter for V0. Pool persists in localStorage and survives refresh.

**Critical implementation detail:** The current `startSession` action overwrites `session.pool` with `[]`. Because the fetch runs in parallel with the greeting and may complete before `startSession` is called, `startSession` must **preserve** the existing pool when transitioning to discovery. Otherwise the pool would be wiped on greeting completion.

**Primary recommendation:** Create `lib/supabase/recipes.ts` with a standalone `fetchRecipes(diet)` function; trigger fetch when GreetingSplash mounts (only if `!session.pool.length`); update `startSession` to preserve `pool`; use Fisher-Yates already in store; add loading skeleton and empty-state error UI in discovery branch.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.99.1 (in use) | Recipe fetch, array filters | Official client; `.contains()` for array columns; GIN indexes on `diet_tags` |
| zustand | ^5.0.11 (in use) | Pool state, persist | `setPool`, `shufflePool` already exist; `persist` middleware |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| motion/react | ^12.36.0 | Skeleton / loading UI | Optional for skeleton; discovery already uses motion |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `.contains('diet_tags', ['Vegetarian'])` | `.overlaps('diet_tags', ['Vegetarian'])` | `contains` = column contains every element; `overlaps` = any element. For single-tag diet, `contains` is correct per CONTEXT |

**Installation:** No new packages — all dependencies already in use.

## Architecture Patterns

### Recommended Project Structure

```
lib/
├── supabase/
│   ├── client.ts     # existing
│   └── recipes.ts    # NEW: fetchRecipes(diet)
stores/
├── session-store.ts  # MODIFY: startSession preserve pool
app/
├── page.tsx          # MODIFY: trigger fetch, loading/empty UX
components/
├── session/
│   └── GreetingSplash.tsx  # existing; fetch triggered from parent
```

### Pattern 1: Supabase Array Contains Diet Filter

**What:** Use `.contains(column, value)` for array columns. `diet_tags` is `text[]`; GIN index exists.
**When to use:** Diet filter per CONTEXT.
**Example:**

```typescript
// lib/supabase/recipes.ts
// Source: Supabase JS Reference - contains()
// https://supabase.com/docs/reference/javascript/contains

import { supabase } from './client'
import type { Recipe } from '@/lib/types/database.types'

export async function fetchRecipes(diet: 'Vegetarian' | 'Vegan' | 'Non-Veg' | null): Promise<Recipe[]> {
  let query = supabase
    .from('recipes')
    .select('*')

  if (diet === 'Vegetarian') {
    query = query.contains('diet_tags', ['Vegetarian'])
  } else if (diet === 'Vegan') {
    query = query.contains('diet_tags', ['Vegan'])
  } else if (diet === 'Non-Veg') {
    // Non-Veg = meat/fish/egg; DATA_QA: Eggetarian also tagged Non-Veg
    query = query.contains('diet_tags', ['Non-Veg'])
  }
  // diet === null → no filter

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
```

### Pattern 2: Fetch-to-Store Handoff with startSession Preservation

**What:** `startSession` is called when greeting completes. Fetch may have already completed and called `setPool`. `startSession` must NOT overwrite `pool`.

**When to use:** Phase 5 fetch flow.

**Current (bug):**

```typescript
startSession: (cuisines, ingredientFilter) =>
  set({
    session: {
      cuisines,
      ingredientFilter,
      pool: [],  // ❌ wipes pool if fetch completed before greeting ended
      currentIndex: 0,
      lastActiveAt: Date.now(),
      setupComplete: true,
    },
  }),
```

**Required fix:**

```typescript
startSession: (cuisines, ingredientFilter) =>
  set((s) => ({
    session: {
      cuisines,
      ingredientFilter,
      pool: s.session.pool,  // preserve — fetch may have already populated
      currentIndex: 0,
      lastActiveAt: Date.now(),
      setupComplete: true,
    },
  })),
```

### Pattern 3: Skip Fetch on Return Visit

**What:** When user returns (refresh or navigate back), pool is already in Zustand from localStorage. Skip fetch.

**When to use:** Any render where `session.pool.length > 0` before greeting.

**Logic:**

```typescript
// In page.tsx or GreetingSplash parent
const pool = useSessionStore((s) => s.session.pool)
const needsFetch = !setupComplete && pool.length === 0
// When showing GreetingSplash: if needsFetch, trigger fetch
// When setupComplete: discovery shows; if pool.length === 0, show skeleton
```

### Anti-Patterns to Avoid

- **Fetch-all then filter client-side:** PITFALLS.md and ARCHITECTURE: server-side filter via `.contains()`; never bare `select('*')` without filters when diet is set.
- **Calling setPool after startSession without preserving pool:** Race condition — fetch can complete before greeting ends; startSession must preserve pool.
- **Fetching on every discovery mount:** Only fetch when `pool.length === 0` and we're in the greeting → discovery flow (not yet setupComplete, or first-time setupComplete with empty pool).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|--------|-------------|--------------|-----|
| Array shuffle | Custom random sort | Fisher-Yates (already in `session-store.ts`) | `sort(() => Math.random() - 0.5)` is biased; Fisher-Yates is uniform |
| Diet filter in SQL | Raw `.filter()` or RPC | `.contains('diet_tags', [diet])` | PostgREST maps to `@>`; GIN index used |
| localStorage persistence | Manual sync | Zustand `persist` | Already configured; handles rehydration |

**Key insight:** The recipe pool service is thin — one fetch function, one filter. Don't add a separate "pool service" layer; keep `fetchRecipes` in `lib/supabase/recipes.ts` and call it from `page.tsx`.

## Common Pitfalls

### Pitfall 1: startSession Wipes Pool

**What goes wrong:** Fetch completes before greeting ends; `setPool` called; 2s later `startSession` runs and sets `pool: []`; discovery shows empty.

**Why it happens:** `startSession` was designed for "new session" and assumed pool would be set later. Phase 5 runs fetch in parallel.

**How to avoid:** Change `startSession` to preserve `s.session.pool` when merging.

**Warning signs:** Discovery shows "Recipes loading soon..." or empty after fetch completes during greeting.

### Pitfall 2: Fetch on Every Discovery Mount

**What goes wrong:** User refreshes; Zustand hydrates with pool; `useEffect` triggers fetch again; redundant network call; possible flash of empty state.

**Why it happens:** Effect runs without checking `pool.length > 0`.

**How to avoid:** Only trigger fetch when `pool.length === 0` and we're in the greeting phase (about to show or showing GreetingSplash).

**Warning signs:** Network tab shows duplicate recipe fetches on refresh.

### Pitfall 3: Diet Filter Applied Client-Side

**What goes wrong:** Fetch all 100 recipes, filter by diet in JS. Works at 100, fails at scale.

**Why it happens:** PITFALLS.md: "Fetch-all + client-side filter" is a known anti-pattern.

**How to avoid:** Apply `.contains('diet_tags', [diet])` in the Supabase query when `diet !== null`.

**Warning signs:** No `.contains()` in fetch; diet check in `useEffect` after fetch.

### Pitfall 4: Empty State vs Loading State Confusion

**What goes wrong:** Fetch fails → show skeleton forever. Or fetch returns 0 recipes → show "loading" instead of empty state.

**Why it happens:** Same `pool.length === 0` for both cases.

**How to avoid:** Track fetch status: `idle | loading | success | error`. On error: empty state with apology. On success with &lt; 5: empty state (Phase 9). On success with ≥ 5: show cards. On loading: skeleton.

**Warning signs:** No distinct error state; only `pool.length === 0` check.

## Code Examples

### Fetch Recipe Pool (Verified)

```typescript
// lib/supabase/recipes.ts
import { supabase } from './client'
import type { Recipe } from '@/lib/types/database.types'
import type { DietPreference } from '@/lib/types/database.types'

export async function fetchRecipes(diet: DietPreference | null): Promise<Recipe[]> {
  let query = supabase.from('recipes').select('*')

  if (diet === 'Vegetarian') {
    query = query.contains('diet_tags', ['Vegetarian'])
  } else if (diet === 'Vegan') {
    query = query.contains('diet_tags', ['Vegan'])
  } else if (diet === 'Non-Veg') {
    query = query.contains('diet_tags', ['Non-Veg'])
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Recipe[]
}
```

### Trigger Fetch from GreetingSplash Parent

```typescript
// app/page.tsx (conceptual)
useEffect(() => {
  if (!setupComplete && pool.length === 0) {
    fetchRecipes(preferences.diet)
      .then((recipes) => {
        const shuffled = shuffleArray(recipes)  // or use store's shufflePool
        useSessionStore.getState().setPool(shuffled)
      })
      .catch(() => {
        // Set error state for empty state UI
      })
  }
}, [setupComplete, pool.length, preferences.diet])
```

### Loading Signal

```typescript
// setupComplete === true && pool.length === 0 => still loading (show skeleton)
// setupComplete === true && pool.length > 0 => show cards
// setupComplete === true && pool.length < 5 && !loading => empty state (Phase 9)
// fetch error => empty state with apology
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Fetch all, filter client | Server-side `.contains()` | Phase 2 research | Correct from day one; scales to 3K+ recipes |
| Manual localStorage sync | Zustand persist | Phase 2 | Rehydration, partialize, safe storage |

**Deprecated/outdated:** None for this phase.

## Open Questions

1. **Where does fetch get triggered?**
   - **What we know:** Fetch starts when GreetingSplash mounts; runs in parallel.
   - **What's unclear:** GreetingSplash mounts when `!setupComplete`. So we need to trigger fetch in the parent (`page.tsx`) when we render the branch that shows GreetingSplash. The parent has access to `preferences.diet` and `session.pool`.
   - **Recommendation:** `useEffect` in `page.tsx` when `!setupComplete && pool.length === 0`; call `fetchRecipes(preferences.diet)`; on success `setPool(shuffleArray(data))`; on error set error state.

2. **Empty state for fetch failure vs &lt; 5 recipes**
   - **What we know:** CONTEXT says "If fetch fails: Show empty state page with apology". POOL-03 says "fewer than 5 triggers empty state (handled in Phase 9)".
   - **What's unclear:** Phase 9 owns empty state UI. Phase 5 must detect both cases and surface them.
   - **Recommendation:** Phase 5: detect fetch error → show apology message (could be inline or full-page). Use `useState` in `page.tsx` for `fetchError`; survives greeting→discovery transition. Detect &lt; 5 recipes on success → show placeholder for Phase 9 empty state; Phase 5 can use same or a minimal "No recipes match" message.

3. **Non-Veg tag in top 100**
   - **What we know:** `recipes_merged.csv` has ~3 Non-Veg recipes in full set; top 100 by view count may have 0–3.
   - **What's unclear:** If user selects Non-Veg and top 100 has 0 recipes, pool will be empty.
   - **Recommendation:** Acceptable for V0; empty state handles it. No special handling needed.

## Sources

### Primary (HIGH confidence)

- Supabase JS Reference - contains() - https://supabase.com/docs/reference/javascript/contains
- Existing codebase: `stores/session-store.ts`, `app/page.tsx`, `lib/types/database.types.ts`
- Phase 2 RESEARCH, ARCHITECTURE.md, PITFALLS.md

### Secondary (MEDIUM confidence)

- DATA_QA_CHECKLIST.md - diet tag semantics
- ARCHITECTURE.md - recipe pool flow, Non-Veg filter

### Tertiary (LOW confidence)

- WebSearch for Supabase array filter - confirmed `.contains()` syntax

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Supabase and Zustand already in use; API verified
- Architecture: HIGH — CONTEXT is prescriptive; startSession fix is clear
- Pitfalls: HIGH — PITFALLS.md and ARCHITECTURE document known issues

**Research date:** 2026-03-13
**Valid until:** 30 days (stable stack)
