# Project Research Summary

**Project:** Aaj Kya Khana Hai? (AKK)  
**Domain:** Swipe-based recipe discovery web app (mobile-first, no-search)  
**Researched:** 2026-03-13  
**Confidence:** HIGH

## Executive Summary

AKK is a **discovery engine**, not a recipe manager. It reduces decision fatigue by presenting one recipe at a time via swipe cards—no search, no browsing. Users expect Tinder-style interaction, diet/cuisine filters, and a path to "Found my pick." The product differentiates through Indian cooking focus (Hebbar's Kitchen), YouTube-first content, and anonymous sessions.

**Recommended approach:** Next.js 15 + React 19 + Supabase + Motion (Framer Motion) + Zustand. Fetch recipes with server-side filters (diet, cuisine) in Supabase—not fetch-all then filter client-side. Use Zustand with persist middleware for session state; recipe detail as overlay, not route. Single fetch per session, fire-and-forget interaction logging.

**Key risks:** (1) Fetch-all at 3,120 recipes causes slow load—use `.in()`, `.contains()`, `limit` in Supabase. (2) Framer Motion requires `"use client"` and proper touch-action on mobile. (3) localStorage can be cleared on mobile—document preference loss, add fallback messaging. (4) AnimatePresence must use `key={recipe.id}` not `key={index}` for correct exit animations.

## Key Findings

### Recommended Stack

Next.js 15 with App Router, React 19, TypeScript 5, Tailwind v4, and Supabase form the core. Motion (framer-motion) handles swipe gestures and animations; Zustand manages session state with localStorage persist. Syne and Plus Jakarta Sans for typography; Material Symbols Outlined (SVG) for icons.

**Core technologies:**
- **Next.js 15** — App Router, Turbopack, Vercel-native; supports `'use client'` for CSR-heavy discovery pages
- **Supabase** — PostgreSQL, REST/Realtime; generous free tier; ideal for vibe-coding without backend code
- **Motion (framer-motion)** — Swipe gestures, `drag`, `onDragEnd`, layout animations; built-in spring physics
- **Zustand** — Session state, recipe pool, filters; minimal API, ~2KB; persist middleware for localStorage
- **Tailwind v4** — Neo-brutalist design maps to utility classes; CSS-first config, faster builds

See [STACK.md](./STACK.md) for version notes, alternatives, and installation.

### Expected Features

**Must have (table stakes):**
- One recipe at a time — full-screen cards, no grids
- Swipe navigation — left=skip, right=like or tap for detail
- Diet + cuisine filters — onboarding diet + blocklist; session cuisine pick
- Recipe detail overlay — photo, name, chips, YouTube + web links; overlay, not route
- Session persistence — card position + pool order survive refresh; 4hr inactivity = new session
- Empty state — min 5 recipes in pool; reset/shuffle when empty
- Settings — edit diet and blocklist
- Mobile-first layout — touch-friendly, neo-brutalist

**Should have (competitive):**
- No search — deliberate product choice; resist all search requests
- Indian cooking focus — Hebbar's Kitchen as trusted source
- YouTube-first content — video recipes match how Indians learn
- Anonymous sessions — localStorage UUID; no auth for V0
- Signal logging — Supabase; swipe_next, tap, youtube_open, found_my_pick
- Success inference — YouTube open + 2hr no return = session_success_inferred
- Shuffle button — re-randomize session pool on demand

**Defer (v2+):**
- Search, meal planning, grocery lists, user accounts, partner sync, personalisation, push notifications, native apps

See [FEATURES.md](./FEATURES.md) for dependency graph and MVP checklist.

### Architecture Approach

Layered: Presentation (Onboarding, Session Setup, Discovery, Recipe Detail) → State (Zustand + localStorage) → Data (Supabase client, Interaction Logger). Single fetch per session; filter and randomize on client only for runtime filters (e.g. ingredient) that can't be expressed in SQL. Recipe detail is overlay, not route—preserves card position.

**Major components:**
1. **CardStack + RecipeCard** — Stack manages z-index; Card owns Framer Motion drag; `onSwipe(direction)` callback
2. **Zustand store** — Session, preferences, pool, index; persist middleware syncs to localStorage
3. **Recipe Pool Service** — Fetch from Supabase with filters; filter + randomize; no UI dependency
4. **Interaction Logger** — Fire-and-forget inserts to `user_interactions`; never block UI
5. **RecipeDetailSheet** — Bottom sheet overlay over discover; selectedRecipe from store

See [ARCHITECTURE.md](./ARCHITECTURE.md) for data flows and build order.

### Critical Pitfalls

1. **Fetch-all + client-side filtering** — Use Supabase `.in()`, `.contains()`, `.overlaps()` for diet_tags, cuisine_tags; `order by random()` or seeded random; add `limit`. Avoid unbounded `select('*')`.

2. **Framer Motion hydration** — Add `"use client"` at top of any file importing `motion` or `AnimatePresence`. Keep discovery loop in client-only subtree.

3. **Framer Motion drag on mobile** — Apply `touch-action: none` (or `pan-y`) to draggable element; set `dragElastic={0}`, velocity/distance threshold; test on real iOS Safari and Android Chrome.

4. **AnimatePresence key** — Use `key={recipe.id}` not `key={index}`; index-based keys cause wrong exit animations.

5. **localStorage on mobile** — Can be cleared after ~7 days or when low on memory. Add try/catch; document preference loss; consider "Preferences may have been cleared" message if stale.

6. **Zustand re-renders** — Avoid `const { a, b } = useStore()`; use granular selectors or `useShallow`.

See [PITFALLS.md](./PITFALLS.md) for full list, recovery strategies, and phase mapping.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation
**Rationale:** App shell, layout, fonts, and design tokens must exist before any feature work.  
**Delivers:** Next.js 15 app, Tailwind v4, Syne + Plus Jakarta Sans, root layout.  
**Avoids:** Framer Motion hydration (ensure `"use client"` discipline from start).

### Phase 2: Data Layer
**Rationale:** Supabase client and types are shared by all data consumers. Zustand store depends on types.  
**Delivers:** `lib/supabase.ts`, `lib/types.ts`, Zustand store with persist middleware.  
**Addresses:** Session persistence foundation.  
**Avoids:** Fetch-all (design query patterns with filters from the start).

### Phase 3: Recipe Pool
**Rationale:** Discovery loop needs filtered, randomized pool. Must be built before CardStack.  
**Delivers:** `lib/recipe-pool.ts` — fetch with Supabase filters (diet, cuisine), filter + randomize.  
**Uses:** Supabase client, Zustand store.  
**Avoids:** Pitfall 1 — use `.in()`, `.contains()`, `limit`; no unbounded select.

### Phase 4: Discovery Loop (Card + CardStack)
**Rationale:** Core UX; depends on pool and store.  
**Delivers:** CardStack, RecipeCard with Framer Motion swipe; FilterBar; discovery page.  
**Implements:** One recipe at a time, swipe navigation.  
**Avoids:** Pitfall 3 (use client), 4 (touch-action), 7 (AnimatePresence key), 8 (swipe threshold).

### Phase 5: Recipe Detail + Interaction Logger
**Rationale:** Can run in parallel after Phase 3. Recipe detail is overlay; logger is fire-and-forget.  
**Delivers:** RecipeDetailSheet overlay, Interaction Logger service.  
**Addresses:** Recipe detail view, Found my pick CTA, signal logging.  
**Avoids:** Recipe detail as route; awaiting logging.

### Phase 6: Onboarding + Session Setup
**Rationale:** Depends on store; gates discovery.  
**Delivers:** Diet preference, cuisine blocklist, cuisine pick, optional ingredient filter.  
**Addresses:** Onboarding, session setup.  
**Avoids:** localStorage without try/catch.

### Phase 7: Polish
**Rationale:** Empty state, shuffle, settings, success inference.  
**Delivers:** Empty state with reset/shuffle, settings page, success inference heuristic.  
**Addresses:** Empty state handling, settings, shuffle button.

### Phase Ordering Rationale

- **1 → 2 → 3 → 4** is the critical path: shell → data → pool → discovery. Phases 5 and 6 can run in parallel after 3.
- Recipe detail as overlay (not route) is an architectural decision—implement in Phase 5.
- Onboarding and session setup write to the same store used by discovery; build after store exists.
- Empty state and polish depend on discovery loop and recipe pool being functional.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3:** Supabase query composition for diet_tags, cuisine_tags arrays—verify `.contains()` / `.overlaps()` syntax for JSONB/array columns.
- **Phase 4:** Framer Motion swipe on real mobile devices—may need Motion One + @use-gesture if drag lag persists.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Next.js + Tailwind—well-documented.
- **Phase 2:** Supabase Next.js quickstart, Zustand persist—official docs.
- **Phase 5:** Fire-and-forget logging—established pattern.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official docs, create-next-app, Vercel/Supabase ecosystem |
| Features | HIGH | PRD, competitor analysis, clear table stakes vs anti-features |
| Architecture | HIGH | Motion card stack tutorial, Zustand persist, Supabase patterns |
| Pitfalls | MEDIUM | WebSearch + community reports; some findings from GitHub issues |

**Overall confidence:** HIGH

### Gaps to Address

- **Supabase array/JSONB filtering:** Exact syntax for `diet_tags`, `cuisine_tags` in Postgres—verify during Phase 3 implementation.
- **localStorage fallback:** V0 accepts risk; add "preferences cleared" messaging when `lastSeen` is stale. Plan IndexedDB or anonymous auth for V1 if retention matters.
- **YouTube thumbnails:** Use `img.youtube.com`; add `onError` fallback. Plan migration to Supabase Storage if CORS/availability issues arise.

## Sources

### Primary (HIGH confidence)
- [Next.js 15 Release](https://nextjs.org/blog/next-15) — Caching, Turbopack
- [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Motion for React](https://motion.dev/docs/react-quick-start) — Swipe, drag
- [Zustand Persist](https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md)
- [Motion Card Stack Tutorial](https://motion.dev/tutorials/react-card-stack)

### Secondary (MEDIUM confidence)
- [Panly: Opinionated Decision Engine](https://ted2xmen.medium.com/stop-scrolling-start-cooking-the-architecture-of-an-opinionated-decision-engine-136595349a0b)
- [SomeYum / Food Tinder](https://visieasy.com/blog/food-tinder-app.html)
- [Supabase Query Optimization](https://supabase.com/docs/guides/database/query-optimization)
- [Framer Motion + Next.js 14 use client](https://medium.com/@dolce-emmy/resolving-framer-motion-compatibility-in-next-js-14-the-use-client-workaround-1ec82e5a0a75)

### Tertiary (LOW confidence)
- [localStorage on mobile](https://stackoverflow.com/questions/66838054/local-storage-how-does-it-behave-on-mobile-devices)
- [AI-generated code failure patterns](https://www.augmentcode.com/guides/debugging-ai-generated-code-8-failure-patterns-and-fixes)

---
*Research completed: 2026-03-13*  
*Ready for roadmap: yes*
