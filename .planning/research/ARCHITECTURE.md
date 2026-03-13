# Architecture Research

**Domain:** Swipe-based recipe discovery web app  
**Project:** Aaj Kya Khana Hai? (AKK)  
**Researched:** 2026-03-13  
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Onboarding   │  │ Session      │  │ Discovery    │  │ Recipe       │    │
│  │ (diet +      │  │ Setup        │  │ Page         │  │ Detail       │    │
│  │  blocklist)  │  │ (cuisine +   │  │ (card stack) │  │ (overlay)    │    │
│  │              │  │  ingredient) │  │              │  │              │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │                 │            │
├─────────┴─────────────────┴─────────────────┴─────────────────┴────────────┤
│                         STATE LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Zustand Store (session, preferences, pool, card index)             │    │
│  │  ←→ localStorage persistence (session_id, filters, pool snapshot)   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────────────┤
│                         DATA LAYER                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐                          │
│  │ Supabase Client     │  │ Interaction Logger   │                          │
│  │ (recipes fetch)     │  │ (fire-and-forget     │                          │
│  │                     │  │  inserts)            │                          │
│  └─────────┬───────────┘  └──────────┬──────────┘                          │
│            │                         │                                     │
└────────────┼─────────────────────────┼─────────────────────────────────────┘
             │                         │
             ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Supabase: recipes (read) | user_sessions (insert) | user_interactions       │
│  (insert)                                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|-----------------|-------------------|
| **Onboarding** | Diet preference + cuisine blocklist selection; writes to localStorage + Zustand | Zustand store |
| **Session Setup** | Cuisine pick (1–3), optional ingredient filter; starts session | Zustand store, Recipe Pool |
| **Discovery Page** | Full-screen card stack, swipe UI, filter bar, shuffle | Card Stack, Zustand, Interaction Logger |
| **Card Stack** | Manages visible cards, z-index ordering, swipe threshold | Card, Zustand (pool, index) |
| **Card** | Single recipe display, drag gesture, rotation/opacity via Framer Motion | Card Stack (onSwipe), Interaction Logger |
| **Recipe Detail Overlay** | Bottom sheet over discovery; photo, chips, links, "Found my pick" | Zustand (current recipe), Interaction Logger |
| **Empty State** | Shown when filtered pool &lt; 5 recipes; reset/shuffle options | Zustand, Session Setup |
| **Zustand Store** | Session state, preferences, recipe pool, current index; syncs to localStorage | All UI components |
| **Recipe Pool Service** | Fetch from Supabase with server-side filters (diet, blocklist, cuisine, ingredient); randomize on client | Supabase, Zustand |
| **Interaction Logger** | Fire-and-forget inserts to `user_interactions` | Supabase |

## Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout, fonts, providers
│   ├── page.tsx                # Redirect / landing → /discover or /onboard
│   ├── onboard/
│   │   └── page.tsx            # Diet + blocklist (first-time only)
│   ├── session/
│   │   └── page.tsx            # Cuisine + ingredient pick (per session)
│   └── discover/
│       └── page.tsx            # Main discovery loop (client component)
├── components/
│   ├── discovery/
│   │   ├── CardStack.tsx       # Stack container, manages card order
│   │   ├── RecipeCard.tsx      # Single card, Framer Motion drag
│   │   └── FilterBar.tsx       # Cuisine / meal / ingredient filters
│   ├── overlay/
│   │   └── RecipeDetailSheet.tsx  # Bottom sheet over discover
│   ├── onboarding/
│   │   ├── DietPreference.tsx
│   │   └── CuisineBlocklist.tsx
│   ├── session-setup/
│   │   ├── CuisinePick.tsx
│   │   └── IngredientFilter.tsx
│   └── ui/                    # Shared: buttons, chips, etc.
├── lib/
│   ├── supabase.ts            # Browser Supabase client
│   ├── types.ts               # Recipe, Session, etc.
│   └── recipe-pool.ts         # Fetch, filter, randomize logic
├── stores/
│   └── session-store.ts       # Zustand + persist middleware
└── services/
    └── interaction-logger.ts # Fire-and-forget Supabase inserts
```

### Structure Rationale

- **app/discover/page.tsx**: Single route for discovery; recipe detail is an overlay, not a route. Keeps URL stable and preserves card position.
- **components/discovery/**: Card stack and card are co-located; CardStack owns swipe orchestration, RecipeCard owns gesture + visuals.
- **lib/recipe-pool.ts**: Pure functions for filtering/randomization; no React dependency. Testable in isolation.
- **stores/session-store.ts**: Single Zustand store with slices for preferences, session, pool, and UI state. Use `persist` middleware for localStorage.
- **services/interaction-logger.ts**: Decoupled from UI; components call `logInteraction(action, metadata)` without awaiting.

## Data Flow

### Recipe Pool Flow

```
[Session Start / Refresh]
    ↓
Zustand: needs pool? → Recipe Pool Service
    ↓
Supabase query with SERVER-SIDE filters:
  .select(needed_columns)
  .contains('diet_tags', [diet_preference])     — if Veg/Vegan
  .overlaps('cuisine_tags', [session_cuisines])  — match any selected
  NOT .overlaps('cuisine_tags', [blocklist])     — exclude blocked
  .contains('main_ingredients', [ingredient])    — if ingredient set
    ↓
Client: Randomize result (Fisher–Yates)
    ↓
Zustand: set pool, reset index to 0
    ↓
Card Stack renders from pool[index]
```

**Key principle:** Heavy filtering (diet, cuisine, blocklist) happens in Supabase via GIN-indexed array queries. Client-side handles only randomization and session transforms.

### Swipe / Interaction Flow

```
[User swipes card]
    ↓
RecipeCard onDragEnd → threshold check
    ↓
CardStack: remove card, increment index
    ↓
Zustand: update index (persist to localStorage)
    ↓
Interaction Logger: log('swipe_next', { recipe_id })  [fire-and-forget]
```

### Recipe Detail Flow

```
[User taps card]
    ↓
Zustand: set selectedRecipe
    ↓
RecipeDetailSheet opens (overlay)
    ↓
[User taps "Found my pick"]
    ↓
Interaction Logger: log('found_my_pick', { recipe_id })
    ↓
Zustand: mark recipe as picked, close overlay
```

### Session Persistence Flow

```
[Page load]
    ↓
Zustand hydrate from localStorage
    ↓
If session_id + pool exist + < 4h old → restore discovery state
    ↓
Else → redirect to /session (new session)
```

## Architectural Patterns

### Pattern 1: Server-Side Filter, Client-Side Randomize

**What:** Apply all heavy filters (diet, cuisine, blocklist, ingredient) as Supabase query conditions using GIN-indexed array columns. Randomize the result on the client.  
**When:** Always. Server-side filtering is correct at any scale. Client-side randomization is fine since the filtered pool is small (typically 50-500 recipes).  
**Trade-offs:** Slightly more complex query composition; but correct from day one. No migration needed at scale.

```typescript
// lib/recipe-pool.ts
export async function fetchAndPreparePool(
  supabase: SupabaseClient,
  filters: SessionFilters
): Promise<Recipe[]> {
  let query = supabase
    .from('recipes')
    .select('id, video_id, recipe_name_english, thumbnail, diet_tags, cuisine_tags, meal_type, one_line_hook, url, web_recipe_link, main_ingredients, total_time_mins, difficulty');

  if (filters.diet === 'Vegetarian') {
    query = query.contains('diet_tags', ['Vegetarian']);
  } else if (filters.diet === 'Vegan') {
    query = query.contains('diet_tags', ['Vegan']);
  } else if (filters.diet === 'Non-Veg') {
    query = query.overlaps('diet_tags', ['Non-Veg', 'Eggetarian']);
  }

  if (filters.cuisines.length > 0) {
    query = query.overlaps('cuisine_tags', filters.cuisines);
  }

  // Blocklist exclusion handled via .not or RPC
  // Randomize on client after fetch
  const { data } = await query;
  return shuffleArray(data ?? []);
}
```

### Pattern 2: Fire-and-Forget Logging

**What:** Interaction logging does not block UI. Call `logInteraction()` without `await`; errors are swallowed or logged to console.  
**When:** Analytics/telemetry where user flow must not be blocked.  
**Trade-offs:** No retry; some events may be lost. Acceptable for V0.

```typescript
// services/interaction-logger.ts
export function logInteraction(sessionId: string, action: string, metadata?: object) {
  supabase.from('user_interactions').insert({ session_id: sessionId, action, metadata })
    .then(() => {})
    .catch(console.error);
}
```

### Pattern 3: Zustand + localStorage Persist

**What:** Use Zustand `persist` middleware to sync session state to localStorage. Key by `session_id`.  
**When:** Anonymous sessions; need to survive refresh within same session.  
**Trade-offs:** localStorage limit (~5MB); don't persist full recipe objects if pool is large—persist pool IDs + index only.

```typescript
// stores/session-store.ts
import { persist } from 'zustand/middleware';

export const useSessionStore = create(
  persist(
    (set) => ({
      sessionId: null,
      pool: [],
      index: 0,
      preferences: { diet: null, blocklist: [] },
      // ...
    }),
    { name: 'akk-session', partialize: (s) => ({ ... }) }
  )
);
```

### Pattern 4: Card Stack with Framer Motion

**What:** Stack component renders cards in reverse order; only front card is draggable. `useMotionValue` + `useTransform` for rotation/opacity.  
**When:** Tinder-style swipe UI.  
**Trade-offs:** Well-documented pattern; requires careful z-index and exit animation handling.

```typescript
// CardStack: cards in reverse order, zIndex: cards.length - index
// RecipeCard: drag="x", onDragEnd checks threshold, calls onSwipe(direction)
// useTransform(x, [-200, 0, 200], [-25, 0, 25]) for rotation
```

### Pattern 5: Overlay Instead of Route for Detail

**What:** Recipe detail is a bottom sheet / overlay rendered over the discovery page. No route change.  
**When:** User should return to same card position; avoid full-page navigation.  
**Trade-offs:** Simpler state; overlay must handle scroll lock and focus trap for a11y.

### Pattern 6: App-Level Error Boundary

**What:** A React Error Boundary at the root layout catches any unhandled render error and shows a branded fallback UI (not a white screen). The fallback includes a "Try again" button that reloads the page.  
**When:** Always. This is mandatory from Phase 1.  
**Trade-offs:** Minimal effort; prevents the worst UX failure (blank white screen).

```typescript
// components/ErrorBoundary.tsx
'use client';
import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('App error boundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
          <h1 className="font-syne text-2xl font-bold mb-4">
            Oops! Something broke.
          </h1>
          <p className="mb-6 text-charcoal/70">
            We hit an unexpected error. Try refreshing.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-burnt-orange text-white font-bold border-2 border-charcoal rounded-lg"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
export default ErrorBoundary;
```

**Implementation:** Wrap the root layout's `{children}` with `<ErrorBoundary>`. Place it inside providers but outside route content.

## Build Order (Dependencies)

| Phase | Deliverable | Depends On | Notes |
|-------|-------------|------------|-------|
| **1** | App shell, layout, fonts | — | Next.js 15 App Router, Tailwind, design tokens |
| **2** | Supabase client + types | — | `lib/supabase.ts`, `lib/types.ts` from schema |
| **3** | Zustand store + persist | — | Session, preferences, pool, index; localStorage key |
| **4** | Recipe pool service | 2, 3 | Fetch, filter, randomize; no UI |
| **5** | Card + CardStack | 3 | Framer Motion swipe; consume pool from store |
| **6** | Discovery page | 4, 5 | Compose CardStack, FilterBar, empty state placeholder |
| **7** | Recipe detail overlay | 3, 6 | Bottom sheet; selectedRecipe from store |
| **8** | Interaction logger | 2, 3 | Fire-and-forget; session_id from store |
| **9** | Onboarding + session setup | 3 | Diet, blocklist, cuisine, ingredient; write to store |
| **10** | Empty state + polish | 4, 6 | Reset/shuffle when pool &lt; 5 |

**Critical path:** 1 → 2 → 3 → 4 → 5 → 6. Phases 7, 8, 9 can run in parallel after 3. Phase 10 depends on 4 and 6.

## Anti-Patterns

### Anti-Pattern 1: Per-Swipe Fetch

**What people do:** Fetch next recipe on each swipe.  
**Why it's wrong:** Latency on every swipe; janky UX.  
**Do this instead:** Fetch filtered pool once via server-side Supabase query; randomize on client.

### Anti-Pattern 2: Recipe Detail as Route

**What people do:** `/discover/[id]` for recipe detail.  
**Why it's wrong:** Loses card position; back button exits discovery.  
**Do this instead:** Overlay/bottom sheet over discover page; state in store.

### Anti-Pattern 3: Awaiting Logging

**What people do:** `await logInteraction()` before updating UI.  
**Why it's wrong:** Blocks swipe/detail interactions on slow network.  
**Do this instead:** Fire-and-forget; never block on analytics.

### Anti-Pattern 4: Persisting Full Recipe Objects

**What people do:** Store entire recipe objects in localStorage for persistence.  
**Why it's wrong:** 3,120 recipes × ~2KB ≈ 6MB; exceeds localStorage.  
**Do this instead:** Persist pool IDs + index; re-fetch or keep pool in memory only for V0.

## Integration Points

### Supabase

| Operation | Pattern | Notes |
|-----------|---------|-------|
| Recipes read | `supabase.from('recipes').select(cols).contains().overlaps()` | Server-side filtered; GIN indexes; RLS public read |
| Sessions insert | `supabase.from('user_sessions').insert(...)` | On session start; fire-and-forget ok |
| Interactions insert | `supabase.from('user_interactions').insert(...)` | Fire-and-forget; no await |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI ↔ Store | Zustand `useStore` / actions | No prop drilling for pool, index, preferences |
| CardStack ↔ Card | Props + callback | `onSwipe(direction)` from Card to Stack |
| Logger ↔ Components | Import + call | `logInteraction()`; no store dependency |
| Recipe Pool ↔ Store | Called from session setup / discover | Store dispatches fetch; pool service returns data |

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|---------------------------|
| 100 recipes (V0) | Server-side filter still applies; persist pool in memory; localStorage for session_id + index only |
| 3,120 recipes | Server-side filter keeps payload small; GIN indexes handle array queries efficiently |
| 10K+ users | Supabase handles; ensure RLS; interaction inserts are append-only, low cost |

### Scaling Priorities

1. **First bottleneck:** Already mitigated — server-side filtering via GIN indexes ensures only relevant recipes are sent. Payload stays small regardless of total recipe count.
2. **Second bottleneck:** localStorage size if persisting too much. Mitigate: persist only IDs + index; re-fetch pool on restore if needed.

## Sources

- [Motion Card Stack Tutorial](https://motion.dev/tutorials/react-card-stack) — Framer Motion swipe pattern
- [Framer Motion useTransform](https://www.framer.com/motion/use-transform/) — Transform API
- [Zustand Persist Middleware](https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md) — localStorage sync
- [Supabase Next.js Client](https://supabase.com/docs/guides/auth/server-side/nextjs) — Client setup
- Project: `.planning/PROJECT.md`, `scripts/schema.sql`, `stitch_screens/`, `DESIGN_SYSTEM.md`

---
*Architecture research for: Aaj Kya Khana Hai? — swipe-based recipe discovery*
*Researched: 2026-03-13*
