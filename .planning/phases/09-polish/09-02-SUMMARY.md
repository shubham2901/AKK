---
phase: 09-polish
plan: 02
subsystem: settings-pool-rebuild
---

# Plan 09-02 Summary

**Status:** Complete

## What shipped

- **`filterRecipesByBlocklist`** — client-side exclusion by `cuisine_tags` / `cuisine` (`lib/utils/recipe-filters.ts`).
- **Constants** — `lib/constants/diets.ts`, `lib/constants/cuisines.ts`; onboarding steps import shared lists.
- **`SettingsScreen`** — full-screen diet cards + blocklist chips; Done/back rebuilds pool.
- **`rebuildPoolFromPreferences`** in `page.tsx` — fetch → blocklist filter → shuffle → `setPool` → `syncSession`.
- **Greeting fetch** — applies blocklist to initial pool.
- **`FilterBar`** — optional **settings** button (left); `onOpenSettings` from discovery.
- **Zero-recipe** path — message + “Open settings” when pool empty after fetch.

## Key files

- `lib/utils/recipe-filters.ts`
- `lib/constants/diets.ts`, `lib/constants/cuisines.ts`
- `components/settings/SettingsScreen.tsx`
- `components/discovery/FilterBar.tsx`
- `components/onboarding/DietStep.tsx`, `BlocklistStep.tsx`
- `app/page.tsx`

## Self-Check: PASSED

- `next build` succeeds
