# Phase 2: Data Layer - Research

**Researched:** 2026-03-13
**Domain:** Supabase client, Zustand state management, TypeScript types, localStorage persistence
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Supabase Project
- **Project:** AKK (project ID: `hrmhnovohubkfyxipjog`)
- **URL:** `https://hrmhnovohubkfyxipjog.supabase.co`
- **Region:** ap-northeast-1
- **Schema applied:** Migration `create_akk_schema` applied with all 3 tables, GIN indexes, RLS policies, and abuse protection constraints
- **Credentials:** `.env.local` already configured with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Persistence Strategy (V0)
- Persist **full Recipe objects** in localStorage for V0 (100 recipes × ~2KB = ~200KB, well within 5MB limit)
- Avoids re-fetch-on-hydration complexity
- Switch to IDs-only when scaling to 3,120 recipes

#### Store Architecture
- **Single Zustand store** with logical groupings (not multiple stores)
- Shape: `sessionId`, `preferences` (diet, blocklist, onboardingComplete), `session` (cuisines, ingredientFilter, pool, currentIndex, lastActiveAt, setupComplete)
- `persist` middleware with `partialize` to exclude actions
- Custom `storage` adapter with `try/catch` for localStorage safety (mobile Safari, private browsing)

#### Interaction Logger
- **Include in Phase 2** (not deferred to Phase 7)
- ~15 lines, pure infrastructure, fire-and-forget `supabase.from('user_interactions').insert()`
- Ready for consumers when discovery loop and recipe detail are built

### Claude's Discretion

- Exact Zustand action names and signatures
- Whether to use `useShallow` or individual selectors (follow Zustand best practices)
- File organization within `lib/`, `stores/`, `services/`
- Whether to generate types manually or use Supabase auto-generated types as base

### Deferred Ideas (OUT OF SCOPE)

- IndexedDB fallback for localStorage (V1 if retention matters)
- Server-side anonymous auth via Supabase (V1)
- "Preferences may have been cleared" messaging (Phase 8 or 9)

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | Supabase client configured with anon key for public recipe reads | Use `createClient` from `@supabase/supabase-js`; env vars already in `.env.local`; no SSR needed for V0 |
| DATA-02 | TypeScript interfaces for Recipe, UserSession, UserInteraction, SessionState | Supabase `gen types` for Recipe/UserSession/UserInteraction; SessionState derived from store shape |
| DATA-03 | Zustand store for session state (preferences, pool, card index, filters) | Single store with `create()` + `persist`; shape per CONTEXT |
| DATA-04 | Zustand persist middleware syncs session state to localStorage | `persist` + `partialize` + custom storage adapter with try/catch |

</phase_requirements>

## Summary

Phase 2 establishes the data layer: a Supabase client for public recipe reads, TypeScript types aligned with the schema, a single Zustand store for session state, and localStorage persistence. For V0, no server-side Supabase client or auth is needed—the browser client with anon key suffices for `recipes` SELECT and `user_interactions` INSERT.

The Zustand store uses the `persist` middleware with `partialize` to persist only state (not actions). A custom storage adapter wrapping `localStorage` with try/catch is required: Safari private browsing throws `QuotaExceededError` on write, and mobile Safari can throw on access. The interaction logger is a thin fire-and-forget service that inserts into `user_interactions`; RLS enforces allowed action types and metadata size.

**Primary recommendation:** Use Supabase-generated types as the base for Recipe/UserSession/UserInteraction; define SessionState manually to match the store shape. Use individual selectors for primitives and `useShallow` when selecting multiple fields or derived objects.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.x (latest) | Supabase client, recipe reads, interaction inserts | Official client; anon key for public reads; RLS enforced |
| zustand | ^5.x (5.0.11+) | Session state, persist to localStorage | Minimal API, no providers; persist middleware built-in; 21M+ weekly downloads |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/ssr | latest | Cookie-based auth, SSR | Deferred to V1; not needed for Phase 2 anon reads |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @supabase/supabase-js createClient | @supabase/ssr createBrowserClient | SSR package adds cookie handling; overkill for V0 anon-only |
| zustand persist | manual localStorage + useEffect | Persist middleware handles rehydration, versioning, partialize; don't hand-roll |

**Installation:**

```bash
npm install @supabase/supabase-js zustand
```

## Architecture Patterns

### Recommended Project Structure

```
lib/
├── supabase/
│   └── client.ts          # createClient singleton (browser)
├── types/
│   └── database.types.ts  # Supabase gen types + SessionState
stores/
├── session-store.ts       # Zustand store + persist
services/
├── interaction-logger.ts  # Fire-and-forget logUserInteraction()
```

**Recommendation:** Keep `lib/supabase/client.ts` for the Supabase client; `stores/` for Zustand; `services/` for interaction logger. Types can live in `lib/types/` or `types/` at root.

### Pattern 1: Supabase Browser Client (V0)

**What:** Single client instance for browser-only usage with anon key.
**When to use:** Public reads (recipes), public inserts (user_interactions); no auth.
**Example:**

```typescript
// lib/supabase/client.ts
// Source: https://supabase.com/docs/reference/javascript/creating-a-client
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### Pattern 2: Zustand Persist with Custom Storage

**What:** `persist` middleware with `partialize` and a storage adapter that wraps localStorage in try/catch.
**When to use:** Persisting session state; must handle Safari private browsing and mobile Safari.
**Example:**

```typescript
// stores/session-store.ts
// Source: Zustand docs, pmndrs/zustand#1910 (Safari), WebSearch (QuotaExceededError)
import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'

const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
    } catch {
      // Safari private browsing, quota exceeded — fail silently
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name)
    } catch {
      // no-op
    }
  },
}

export const useSessionStore = create<SessionState & SessionActions>()(
  persist(
    (set) => ({
      // state + actions
    }),
    {
      name: 'akk-session',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        sessionId: state.sessionId,
        preferences: state.preferences,
        session: state.session,
      }),
    }
  )
)
```

### Pattern 3: Interaction Logger (Fire-and-Forget)

**What:** Service that inserts into `user_interactions` without awaiting; RLS validates action and metadata.
**When to use:** Logging swipe, tap, youtube_open, etc.
**Example:**

```typescript
// services/interaction-logger.ts
import { supabase } from '@/lib/supabase/client'

const ALLOWED_ACTIONS = [
  'swipe_next', 'swipe_prev', 'tap', 'youtube_open', 'web_open',
  'found_my_pick', 'back_no_action', 'shuffle',
  'session_success_inferred', 'filter_change',
] as const

export function logInteraction(
  sessionId: string,
  action: (typeof ALLOWED_ACTIONS)[number],
  recipeId?: string,
  metadata?: Record<string, unknown>
) {
  if (sessionId.length < 8) return
  supabase.from('user_interactions').insert({
    session_id: sessionId,
    recipe_id: recipeId ?? null,
    action,
    metadata: metadata ?? null,
  })
  // Fire-and-forget; no await
}
```

### Anti-Patterns to Avoid

- **Persisting functions:** Use `partialize` to include only state slices; never persist actions. Zustand merges persisted state with in-memory store (including functions) on rehydration.
- **Awaiting interaction logs:** Per CONTEXT, fire-and-forget; no UI feedback or blocking.
- **Using getSession() in server code:** Deferred; for V1 auth use `getClaims()` per Supabase docs.
- **Trusting localStorage without try/catch:** Safari private browsing throws on write; wrap all access.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| localStorage persistence | Manual getItem/setItem + useEffect | Zustand `persist` middleware | Handles rehydration, versioning, partialize; avoids hydration mismatches |
| Supabase types | Manual interfaces from schema | `supabase gen types typescript` | Stays in sync with DB; Row/Insert/Update variants |
| Storage adapter | Raw localStorage | Custom adapter with try/catch around StateStorage | Safari private browsing throws; must fail gracefully |
| Recipe fetch logic | Raw fetch + manual typing | `supabase.from('recipes').select()` | Type-safe, RLS-aware, pagination support |

**Key insight:** Zustand persist already handles serialization, rehydration, and merging. The only custom piece is the storage adapter for Safari/private-browsing safety.

## Common Pitfalls

### Pitfall 1: Safari Private Browsing / QuotaExceededError

**What goes wrong:** `localStorage.setItem` throws `QuotaExceededError` (DOM Exception 22) in Safari private mode; quota is 0.
**Why it happens:** Safari exposes localStorage API but doesn't support writes in private browsing.
**How to avoid:** Wrap `getItem`/`setItem`/`removeItem` in try/catch; on error, return null (getItem) or no-op (setItem/removeItem).
**Warning signs:** Users report "app resets on refresh" only on Safari; console shows QuotaExceededError.

### Pitfall 2: Persisting Store Actions (Functions)

**What goes wrong:** Functions get stringified as `{}` or cause serialization errors; Safari can persist `foo: {}` for functions (pmndrs/zustand#1910).
**Why it happens:** `partialize` not used; entire state (including actions) persisted.
**How to avoid:** Use `partialize` to return only the state slices to persist (sessionId, preferences, session). Exclude all functions.
**Warning signs:** Persisted JSON contains empty objects for action keys; rehydration fails or actions are lost.

### Pitfall 3: Hydration Mismatch (Next.js + Zustand)

**What goes wrong:** Server renders with empty state; client hydrates with persisted state; React hydration error.
**Why it happens:** Persist rehydrates asynchronously; initial render may differ from server.
**How to avoid:** Use `skipHydration: true` and manually call `persist.rehydrate()` in a client-only effect, or gate UI that depends on persisted state behind `_hasHydrated` flag. Zustand docs: "SSR and Hydration" guide.
**Warning signs:** "Text content does not match" hydration error; flicker on first load.

### Pitfall 4: user_interactions RLS Rejection

**What goes wrong:** Insert fails silently; RLS rejects due to invalid action or metadata size.
**Why it happens:** Action must be in allowed list; metadata limited to 4KB; session_id length >= 8.
**How to avoid:** Use typed action constant; validate metadata size before insert; ensure sessionId is set.
**Warning signs:** Logs never appear in Supabase; no error surfaced (fire-and-forget).

## Code Examples

### Supabase Client + Recipe Fetch

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Usage: fetch recipes
const { data, error } = await supabase
  .from('recipes')
  .select('*')
  .contains('diet_tags', ['vegetarian'])
  .limit(100)
```

### Zustand Selectors (useShallow vs Individual)

```typescript
// For primitives / single fields — use individual selectors (no extra import)
const diet = useSessionStore((s) => s.preferences.diet)
const currentIndex = useSessionStore((s) => s.session.currentIndex)

// For multiple fields or derived objects — use useShallow to avoid rerenders
import { useShallow } from 'zustand/react/shallow'
const { cuisines, ingredientFilter } = useSessionStore(
  useShallow((s) => ({
    cuisines: s.session.cuisines,
    ingredientFilter: s.session.ingredientFilter,
  }))
)
```

### Supabase Type Generation

```bash
npx supabase gen types typescript --project-id hrmhnovohubkfyxipjog > lib/types/database.types.ts
```

Then use helpers:

```typescript
import type { Database, Tables } from './database.types'

type Recipe = Tables<'recipes'>
type UserSession = Tables<'user_sessions'>
type UserInteraction = Tables<'user_interactions'>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| whitelist/blacklist in persist | partialize | Zustand v4 | More flexible; filter by function |
| anon key only | publishable key (sb_publishable_xxx) | Supabase 2025 transition | Both work; anon key still valid |
| createClient from supabase-js | createBrowserClient from @supabase/ssr | Next.js App Router | SSR package for auth/cookies; not needed for anon-only |

**Deprecated/outdated:**
- `whitelist`/`blacklist` in persist: Use `partialize` instead.

## Open Questions

1. **Zustand hydration with Next.js 16**
   - What we know: Zustand persist is async; server has no localStorage.
   - What's unclear: Whether Next.js 16 / React 19 changes hydration behavior.
   - Recommendation: Use `skipHydration: true` and call `persist.rehydrate()` in `useEffect`; or gate persisted-state UI behind `_hasHydrated` flag. Verify in Phase 2 implementation.

2. **Supabase env var naming**
   - What we know: CONTEXT uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`; Supabase docs mention `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for new keys.
   - What's unclear: N/A — anon key works; stick with CONTEXT.
   - Recommendation: Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` as specified.

## Sources

### Primary (HIGH confidence)

- [Supabase JavaScript Reference](https://supabase.com/docs/reference/javascript/creating-a-client) — createClient, TypeScript types
- [Supabase Type Generation](https://supabase.com/docs/guides/api/rest/generating-types) — gen types CLI
- [Zustand persist middleware](https://zustand.docs.pmnd.rs/reference/middlewares/persist) — persist, partialize, storage
- [Zustand persisting store data](https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data) — createJSONStorage, StateStorage
- [pmndrs/zustand#1910](https://github.com/pmndrs/zustand/issues/1910) — Safari localStorage, filter functions
- [Supabase Next.js SSR](https://supabase.com/docs/guides/auth/server-side/nextjs) — createBrowserClient (for reference; not used in V0)

### Secondary (MEDIUM confidence)

- WebSearch: Zustand useShallow vs selector — useShallow for objects/derived; individual for primitives
- WebSearch: localStorage Safari private browsing — QuotaExceededError, try/catch
- WebSearch: Zustand partialize exclude actions — partialize returns only state to persist

### Tertiary (LOW confidence)

- iOS 11+ Safari private browsing: Some sources say localStorage works; others say it throws. Recommendation: keep try/catch regardless.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Official Supabase and Zustand docs; npm versions verified
- Architecture: HIGH — Patterns from official docs and GitHub issues
- Pitfalls: HIGH — Safari issue documented in zustand#1910; RLS from schema.sql

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (30 days; stack is stable)
