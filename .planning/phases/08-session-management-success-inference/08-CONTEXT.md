# Phase 8: Session Management + Success Inference - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Anonymous session lifecycle and success inference. Session UUID created eagerly on first app load (before onboarding). Sessions persist across refresh, rotate after 4 hours of inactivity (soft reset), and sync to Supabase. Success inference detects when a user opens YouTube and doesn't return for 2+ hours, logging the signal for analytics.

</domain>

<decisions>
## Implementation Decisions

### Session ID creation timing
- Generate `sessionId` eagerly on first app load — in the store initializer or `onRehydrateStorage`, not in `startSession`
- Session captures full lifecycle including onboarding choices
- If `sessionId` is empty after hydration, generate via `crypto.randomUUID()`

### 4-hour inactivity timeout
- Soft reset: new `sessionId`, `currentIndex` = 0, pool reshuffled (new random order)
- Keep: pool recipes, `cuisineFilter`, `mealTypeFilter`, `pickedIds`
- Clear: `viewedIds` (already session-scoped and not persisted)
- Update `lastActiveAt` to now
- Fire-and-forget INSERT new session to `user_sessions`

### Timeout check triggers
- Maximum coverage: page load + `visibilitychange` (tab becomes visible) + `window.focus`
- All three triggers run the same lifecycle check

### Session sync to Supabase
- Fire-and-forget INSERT to `user_sessions` when a new session is created (first open or post-timeout)
- One row per session, no updates
- Fields: `session_id`, `diet_preference`, `cuisine_blocklist`, `cuisine_filter`, `meal_type_filter`, `ingredient_filter`
- Filter columns capture the snapshot at session creation time

### Success inference — YouTube tracking
- Track only the LAST youtube_open per session — store one `{ sessionId, recipeId, timestamp }` pair
- Stored in a separate localStorage key (`akk-last-youtube`), independent of the Zustand store
- Survives store resets and session rotations
- Old sessionId stored alongside so inference logs against the correct session

### Success inference — detection
- On app open/resume (same hooks as timeout check), before the timeout check runs:
  1. Read `akk-last-youtube` from localStorage
  2. If exists and `Date.now() - timestamp > 2 hours`: log `session_success_inferred` with the stored sessionId and recipeId, then clear the key
  3. If exists but < 2 hours: leave it (checked again on next trigger)
- Runs BEFORE the 4-hour timeout check so the inference uses the correct old session ID

### Lifecycle hook architecture
- Single `useSessionLifecycle` hook mounted at top level (page.tsx or layout)
- Execution order on every app open/resume:
  1. Check success inference (uses stored old sessionId)
  2. Check 4-hour timeout (may rotate sessionId)
  3. Touch `lastActiveAt`

### SMGM-02 (already done)
- Card position, pool order, and filters already persist via Zustand's `partialize`
- No new work needed — just verify after other changes

### Claude's Discretion
- Exact placement of the `useSessionLifecycle` hook (page.tsx vs layout vs a wrapper component)
- Whether to debounce rapid visibilitychange/focus events (recommended: skip if last check was <1 second ago)
- Error handling for the Supabase INSERT (fire-and-forget, log to console only)
- Whether `shufflePool` is reused or a dedicated reshuffle is done inline during timeout

</decisions>

<specifics>
## Specific Ideas

- The lifecycle hook is the single source of truth for session transitions — no other code should create sessionIds
- Success inference is decoupled from the store intentionally: separate localStorage key means it works even if the store is reset or corrupted
- The "last YouTube wins" heuristic is simple and correct for V0 — if a user opens 3 YouTube videos, the last one is most likely the one they cooked
- Debouncing the lifecycle check prevents rapid-fire checks when the user alt-tabs quickly

</specifics>

<deferred>
## Deferred Ideas

- Tracking ALL youtube_open timestamps per session (multi-recipe inference) — V2 if analytics show users frequently open multiple YouTube links
- Server-side session validation — V0 is fully client-side, server validation adds auth complexity
- Session expiry notification ("Welcome back! Starting a fresh session") — could be added in Phase 9 polish

</deferred>

---

*Phase: 08-session-management-success-inference*
*Context gathered: 2026-03-13*
