# Phase 8: Session Management + Success Inference — Research

**Completed:** 2026-03-13

## Scope

Six requirements: SMGM-01 through SMGM-04 (anonymous sessions, persistence, 4hr timeout, Supabase sync) and SINF-01/SINF-02 (YouTube success inference). SMGM-02 is already satisfied by existing Zustand persistence.

## Current State Analysis

### Session ID
- Generated in `startSession` via `crypto.randomUUID()` when `sessionId.length < 8`
- `startSession` is called from `page.tsx` when greeting finishes
- Persisted in Zustand under key `akk-session`

### lastActiveAt
- Lives in `session.lastActiveAt` as epoch ms
- Updated by: `startSession`, `nextCard`, `prevCard`, `setCuisineFilter`, `setMealTypeFilter`, `shufflePool`, `resetSession`, `touchActivity`
- Persisted via Zustand (part of `session` object in `partialize`)

### Supabase Tables
- `user_sessions`: schema has `session_id` (text, NOT NULL), `diet_preference`, `cuisine_blocklist`, `cuisine_filter`, `meal_type_filter`, `ingredient_filter`, `created_at` (default `now()`). RLS allows public INSERT only.
- `user_interactions`: already receives fire-and-forget inserts via `logInteraction`. `session_success_inferred` is in the RLS allowed actions list.

### YouTube Open
- Logged to `user_interactions` on click in `RecipeDetailOverlay.tsx` (line 206)
- No local timestamp stored — only the Supabase log

### Pool Shuffle
- `shuffleArray` (Fisher-Yates) exported from `session-store.ts`
- `shufflePool` action reshuffles `session.pool` and resets `currentIndex` to 0

## Technical Approach

### Plan 1: Session Lifecycle Infrastructure

**Eager sessionId**: Move generation from `startSession` into `onRehydrateStorage`. After hydration, if `sessionId` is empty, set it to `crypto.randomUUID()`. This runs once on app load. `startSession` stops generating sessionIds — it just starts the session with whatever ID already exists.

**syncSession service**: New `services/session-sync.ts` with a `syncSession(sessionId, preferences, session)` function. Fire-and-forget INSERT to `user_sessions`. Mirrors the pattern in `interaction-logger.ts`.

**rotateSession store action**: New action that generates a new `sessionId`, resets `currentIndex` to 0, reshuffles pool, clears `viewedIds`, preserves `pickedIds` and filters, and updates `lastActiveAt`. Returns the new sessionId so the caller can sync it to Supabase.

### Plan 2: Lifecycle Hook + YouTube Tracking + Integration

**YouTube localStorage helper**: `lib/utils/youtube-tracker.ts` with `saveYoutubeOpen(sessionId, recipeId)`, `getLastYoutubeOpen()`, `clearYoutubeOpen()`. Uses key `akk-last-youtube`. Shape: `{ sessionId: string; recipeId: string; timestamp: number }`.

**useSessionLifecycle hook**: `hooks/useSessionLifecycle.ts`. Mounts event listeners for `visibilitychange`, `focus`, and runs on mount. On each trigger:
1. Debounce: skip if last check was <1s ago
2. Success inference: read `akk-last-youtube`, if >2hr, log `session_success_inferred` with stored sessionId/recipeId, clear key
3. Timeout: read `session.lastActiveAt`, if >4hr, call `rotateSession`, then `syncSession`
4. Touch: call `touchActivity()`

**Integration**: Mount `useSessionLifecycle` in `page.tsx` (inside the `Home` component, after hydration gate). Update `RecipeDetailOverlay` YouTube click handler to also call `saveYoutubeOpen`.

## Files to Change

| File | Change |
|------|--------|
| `stores/session-store.ts` | Add `rotateSession` action; modify `onRehydrateStorage` for eager sessionId; remove sessionId generation from `startSession` |
| `services/session-sync.ts` | **New file** — `syncSession` function |
| `lib/utils/youtube-tracker.ts` | **New file** — localStorage read/write/clear helpers |
| `hooks/useSessionLifecycle.ts` | **New file** — lifecycle hook (inference + timeout + touch) |
| `app/page.tsx` | Mount `useSessionLifecycle`; call `syncSession` on initial session creation |
| `components/discovery/RecipeDetailOverlay.tsx` | Add `saveYoutubeOpen` call on YouTube link click |

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Rapid visibilitychange/focus spam | Debounce with 1s cooldown in the lifecycle hook |
| Safari private mode localStorage failure | `safeStorage` adapter already handles this; youtube-tracker uses try/catch |
| Store hydration race | Eager sessionId runs in `onRehydrateStorage` callback, which fires after hydration completes |
| Session sync failure | Fire-and-forget with console.error only — same pattern as interaction logger |

## Plan Breakdown

Two plans, executed sequentially:

1. **08-01**: Store changes (eager sessionId, rotateSession), session sync service, update startSession
2. **08-02**: YouTube tracker, useSessionLifecycle hook, integration in page.tsx and RecipeDetailOverlay

---

*Phase: 08-session-management-success-inference*
*Research completed: 2026-03-13*
