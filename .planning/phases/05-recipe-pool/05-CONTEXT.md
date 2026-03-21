# Phase 5 Context: Recipe Pool

## Decisions

### 1. Filter Behavior (V0)

- **Diet selected** → Apply as Supabase filter:
  - "Vegetarian" → `diet_tags @> '{Vegetarian}'`
  - "Vegan" → `diet_tags @> '{Vegan}'`
  - "Non-Veg" → filter for recipes tagged with meat/fish/egg
- **Diet = null (user skipped onboarding diet step)** → No diet filter, fetch all recipes
- **Blocklist** → Not applied in V0 (deferred to Phase 6 filter bar)
- **Cuisine / ingredient filters** → Not applied in V0 (deferred to Phase 6 filter bar)

### 2. Fetch Timing & Loading UX

- **Fetch starts when GreetingSplash mounts** — runs in parallel with the 2-sec greeting
- **Initial fetch**: All matching recipes (no pagination for V0 — only 100 recipes in DB)
- **If fetch completes before greeting ends**: Pool ready, discovery renders cards immediately
- **If fetch still pending after greeting**: Show skeleton of recipe cards until data arrives
- **If fetch fails**: Show empty state page with apology ("Sorry, something went wrong")

### 3. Pool Lifecycle

- **Pool never goes stale** — once fetched, same data stays for the entire session
- **No refetch triggers in V0** — pool is frozen after initial fetch
- **Return within session**: Pool already in Zustand (persisted to localStorage), skip fetch, resume at saved `currentIndex`
- **New session** (after timeout, Phase 8): Pool is cleared and re-fetched

### 4. Fetch-to-Store Handoff

- `page.tsx` orchestrates the flow (already gates onboarding → greeting → discovery)
- Fetch function lives in `lib/supabase/recipes.ts` — standalone, reusable
- On success: shuffle with Fisher-Yates → `setPool(shuffledRecipes)` into Zustand
- Discovery reads from `session.pool` in Zustand store
- Loading signal: `setupComplete === true && session.pool.length === 0` = still loading
- On refresh: Zustand hydration restores pool from localStorage → no re-fetch needed

### 5. Data Availability

- 100 recipes seeded in Supabase `recipes` table from `data/recipes_merged.csv` (top 100 by view count)
- All 100 have YouTube thumbnail URLs (`maxresdefault.jpg`)
- Fields available: `recipe_name_english`, `diet_tags`, `cuisine_tags`, `meal_type`, `main_ingredients`, `one_line_hook`, `flavor_profile`, `vibe_tags`, `kid_friendly`, `difficulty`, `thumbnail`, `url`, `web_recipe_link`, `views`, `likes`

## Deferred Ideas

- Full diet/blocklist/cuisine/ingredient filtering → Phase 6 (filter bar)
- Pagination (fetch 25-50, then load more on scroll) → Phase 6 (when card stack scrolling exists)
- Pool staleness/refetch logic → Phase 8 (session management)

## Summary

Phase 5 fetches all recipes (filtered by diet if user set one), shuffles them client-side, stores them in Zustand. The fetch runs in parallel with the greeting splash. No pagination, no blocklist filter, no cuisine filter for V0. Pool persists in localStorage and survives refresh.
