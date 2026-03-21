# Phase 9: Polish - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Polish the discovery experience when filters yield too few recipes and when users want to change global preferences:

1. **Empty state** — When the session pool has **fewer than 5 recipes** after filtering, show the designed empty state (illustration + headline + actions). No new discovery mechanics beyond reset/shuffle as specified.

2. **Settings** — From **discovery**, user can open **Settings** to edit **diet preference** and **cuisine blocklist** (same domains as onboarding). Changes are persisted and drive the recipe pool; scope does not include accounts, notifications, or new preference types.

Discussion clarified **how** these ship; scope matches ROADMAP Phase 9 and requirements SETT-01–04, EMPT-01–04.

</domain>

<decisions>
## Implementation Decisions

### Empty state layout & tone

- Primary reference: `stitch_screens/6_empty_state.html` — **structure, headline, and illustration style** (blob + **“Hmm. Nothing here.”**). Neo-brutalist vibe consistent with the app; **not** pixel-perfect required beyond matching the mockup’s hierarchy and copy.
- Presentation: **full-screen** empty content within the same mobile shell as discovery (max-width, borders) — not a separate route if the current app keeps discovery on `/`; empty state **replaces** the card stack region while filters/header behavior stays consistent with discovery.
- Optional subcopy under the headline: **minimal or none** unless the mockup includes it; prefer **one short supportive line** only if needed for clarity (Claude’s discretion).

### Empty state actions (Reset filters vs Shuffle anyway)

- **Reset filters** — Clears **session-level filters only**: `cuisineFilter`, `mealTypeFilter`, and `ingredientFilter` in the Zustand session object. Does **not** clear onboarding **cuisine blocklist** or **diet** (those are edited in Settings). Aligns with EMPT-03 (“clears session filters”).
- **Shuffle anyway** — Re-randomizes the **current** pool with **current** (possibly broadened) filters using the same shuffle behavior as discovery (e.g. `shufflePool` / Fisher–Yates on the pool). Does **not** imply a mandatory Supabase refetch unless the pool is empty after reset; if implementation refetches when count is 0, that’s Claude’s discretion.
- After either action, if the pool still has &lt; 5 recipes, **empty state remains** (no fake filler recipes).

### Settings entry & shell

- **Entry from discovery** — User opens Settings via a **persistent control** on the discovery screen (e.g. **gear icon** in the header area). Exact placement (e.g. top-left vs top-right) is **Claude’s discretion** as long as it’s discoverable and touch-friendly (≥44px).
- **Navigation** — Settings is a **full-screen** view (same app shell), not a floating modal. **Back** returns to **discovery** at the same conceptual place (card stack), without resetting onboarding.
- Settings UI reuses onboarding **patterns** for diet cards and blocklist chips where practical; does not need to duplicate onboarding **flow** (no multi-step wizard unless product prefers — default: **single scrollable settings page** with sections).

### When diet / blocklist changes apply (SETT-04 vs roadmap wording)

- **Persist immediately** — Saving or toggling diet/blocklist updates Zustand **persisted preferences** right away (same as onboarding store shape).
- **Pool rebuild** — Rebuild the recipe pool **when the user navigates back from Settings to discovery** (back navigation), so the new preferences apply **in the same app session** without requiring app restart. This satisfies “changes matter immediately” in product terms while avoiding silent mid-swipe pool swaps.
- If the user **does not** open discovery after settings (edge case), next time discovery is shown, pool reflects saved preferences.

### Claude's Discretion

- Exact icon, spacing, and motion for transitions to/from Settings
- Whether settings uses one long page vs sections with sticky headers
- Minor copy variants under empty state if accessibility needs a clearer hint
- Implementation detail of refetch vs shuffle when pool count changes after reset

</decisions>

<specifics>
## Specific Ideas

- Empty state should **feel** like the HTML prototype: blob illustration, bold headline, two clear CTAs (reset vs shuffle).
- Settings should feel **coherent with onboarding** (same diet cards / chip language) so users recognize the controls.

</specifics>

<deferred>
## Deferred Ideas

- Editing blocklist/diet **inline** from empty state without going to Settings — nice-to-have; not in Phase 9 scope.
- **Account / sync** — out of scope (PROJECT.md).
- **Search or browse** — out of scope.

</deferred>

---

*Phase: 09-polish*
*Context gathered: 2026-03-13*
