# Roadmap: Aaj Kya Khana Hai?

## Overview

From a greenfield Next.js app to a working recipe discovery experience: foundation and design system first, then data layer and Zustand store, onboarding and session setup to gate discovery, recipe pool fetch and filter, swipe-based discovery loop with card stack, recipe detail overlay with signal logging, session management and success inference, and finally polish (empty state, settings). Implementation matches design mockups in `stitch_screens/`. Starting with 100 recipes for V0.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation** - App shell, fonts, design tokens, mobile-first layout (completed 2026-03-13)
- [x] **Phase 2: Data Layer** - Supabase client, types, Zustand store with persist (completed 2026-03-13)
- [x] **Phase 3: Onboarding** - Diet preference and cuisine blocklist (first launch only) (completed 2026-03-13)
- [ ] **Phase 4: Session Setup** - Cuisine pick and optional ingredient filter per session
- [x] **Phase 5: Recipe Pool** - Fetch, filter, randomize; min 5 recipes, survives refresh (completed 2026-03-13)
- [x] **Phase 6: Discovery Loop** - Full-screen cards, swipe navigation, filter bar, shuffle (completed 2026-03-13)
- [x] **Phase 7: Recipe Detail + Signal Logging** - Overlay, YouTube/web links, Found my pick, fire-and-forget logging (completed 2026-03-13)
- [ ] **Phase 8: Session Management + Success Inference** - Anonymous sessions, 4hr timeout, success inference
- [ ] **Phase 9: Polish** - Empty state, settings page, reset/shuffle

## Phase Details

### Phase 1: Foundation
**Goal**: App loads on mobile with neo-brutalist design system, no white flash or layout jank
**Depends on**: Nothing (first phase)
**Requirements**: FOUN-01, FOUN-02, FOUN-03, FOUN-04
**Success Criteria** (what must be TRUE):
  1. User opens app on mobile Chrome/Safari; no white flash or layout shift during load
  2. Syne (headings) and Plus Jakarta Sans (body) load without FOUC via next/font
  3. Design tokens (Burnt Orange, Charcoal, hard borders) visible in UI
  4. Layout is mobile-first with max-w-md container; touch targets are min 44px
**Plans:** 2/2 plans complete

Plans:
- [x] 01-01-PLAN.md — Bootstrap Next.js app + root layout (fonts, anti-flash, theme-color)
- [x] 01-02-PLAN.md — Design tokens + branded placeholder page

### Phase 2: Data Layer
**Goal**: Supabase and Zustand infrastructure ready for all data consumers
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. Recipe data can be fetched from Supabase with anon key
  2. TypeScript interfaces exist for Recipe, UserSession, UserInteraction, SessionState
  3. Zustand store holds session state (preferences, pool, card index, filters)
  4. Store state persists to localStorage across page refresh
**Plans:** 2/2 plans complete

Plans:
- [ ] 02-01-PLAN.md — Supabase client, types, interaction logger
- [ ] 02-02-PLAN.md — Zustand store with persist

### Phase 3: Onboarding
**Goal**: First-time user sets diet and blocklist; onboarding never shown again
**Depends on**: Phase 2
**Requirements**: ONBR-01, ONBR-02, ONBR-03, ONBR-04, ONBR-05
**Success Criteria** (what must be TRUE):
  1. User sees diet selection (3 vertical cards with icons) on first launch
  2. User sees cuisine blocklist (asymmetric tag cloud with rotated chips) after diet
  3. Selections save to localStorage; onboarding flow never shown again on subsequent opens
  4. Diet and blocklist screens match design vibe (neo-brutalist, not pixel-match)
**Plans:** 2/2 plans complete

Plans:
- [x] 03-01-PLAN.md — Install motion, Material Symbols font, diet preference screen, onboarding gate in page.tsx
- [x] 03-02-PLAN.md — Cuisine blocklist screen with rotated chip cloud, wire into flow, complete onboarding

### Phase 4: Session Setup
**Goal**: Time-based greeting splash auto-starts session; same-session return resumes position
**Depends on**: Phase 3
**Requirements**: SESS-04 (SESS-01, SESS-02, SESS-03 deferred to Phase 6 filter bar)
**Success Criteria** (what must be TRUE):
  1. New session: user sees time-based greeting for ~2 seconds, then auto-transitions to discovery
  2. Same-session return: user skips greeting, resumes at current card position
  3. Session auto-starts with all cuisines, no ingredient filter
  4. Greeting text varies by time of day (morning/afternoon/evening/night)
**Plans:** 1/1 plans defined

Plans:
- [ ] 04-01-PLAN.md — Greeting splash with 2-sec auto-dismiss, page.tsx flow (greeting vs resume)

### Phase 5: Recipe Pool
**Goal**: Filtered, randomized pool of recipes ready for discovery; survives refresh
**Depends on**: Phase 4
**Requirements**: POOL-01, POOL-02, POOL-03, POOL-04
**Success Criteria** (what must be TRUE):
  1. Pool fetches from Supabase with diet, blocklist, session cuisine, ingredient filters
  2. Pool is randomized on client; order fixed for session duration
  3. Pool has minimum 5 recipes; fewer triggers empty state (handled in Phase 9)
  4. Pool stored in Zustand survives page refresh within same session
**Plans:** 1/1 plans complete

Plans:
- [x] 05-01-PLAN.md — Recipe pool fetch, diet filter, shuffle, persist; loading/error/empty states

### Phase 6: Discovery Loop
**Goal**: User swipes through full-screen recipe cards one at a time; tap opens detail
**Depends on**: Phase 5
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06, DISC-07
**Success Criteria** (what must be TRUE):
  1. Full-screen card shows food photo, recipe name (Syne), cuisine/diet chips, one-line hook
  2. User swipes right/up for next card, left/down for previous; swipe has spring physics
  3. Tap anywhere on card opens Recipe Detail overlay
  4. Shuffle button (top right) re-randomizes pool and resets position to 0
  5. Filter bar at bottom opens bottom sheets for cuisine / meal type / ingredient
  6. Card layout matches immersive design mockup (stitch_screens/3_recipe_card_immersive.html)
**Plans:** 3/3 plans complete

Plans:
- [ ] 06-01-PLAN.md — Store loop + filter state, FilterBottomSheet
- [ ] 06-02-PLAN.md — DiscoveryCard + DiscoveryCardStack (swipe, spring)
- [ ] 06-03-PLAN.md — FilterBar + page integration, tap-to-detail

### Phase 7: Recipe Detail + Signal Logging
**Goal**: User views recipe details, uses YouTube/web links, logs "Found my pick"; all interactions logged
**Depends on**: Phase 6
**Requirements**: DETL-01, DETL-02, DETL-03, DETL-04, DETL-05, DETL-06, DETL-07, LOGG-01, LOGG-02, LOGG-03, LOGG-04
**Success Criteria** (what must be TRUE):
  1. Recipe detail slides up as overlay over discovery card (not full page nav)
  2. Shows food photo, recipe name, chips, one-line hook, YouTube and web recipe links
  3. "Found my pick" CTA logs found_my_pick, shows toast, button changes to "Picked"
  4. All interactions (swipe_next, swipe_prev, tap, youtube_open, web_open, found_my_pick, back_no_action, shuffle) logged fire-and-forget to Supabase
  5. Back arrow returns to discovery at same card position
  6. Recipe detail layout matches editorial mockup (stitch_screens/5_recipe_detail_editorial.html)
**Plans:** 3/3 plans complete

Plans:
- [x] 07-01-PLAN.md — Session foundation (sessionId, pickedIds, viewedIds) + recipe-urls utility
- [x] 07-02-PLAN.md — RecipeDetailOverlay (slide-up, links, CTA, toggle)
- [x] 07-03-PLAN.md — Integration, logging, card badges

### Phase 8: Session Management + Success Inference
**Goal**: Anonymous sessions persist; new session after 4hr inactivity; success inferred when user doesn't return after YouTube
**Depends on**: Phase 7
**Requirements**: SMGM-01, SMGM-02, SMGM-03, SMGM-04, SINF-01, SINF-02
**Success Criteria** (what must be TRUE):
  1. Anonymous session UUID created on first app open; synced to user_sessions table
  2. Card position, pool order, and filters survive page refresh within session
  3. New session created after 4 hours of inactivity (based on last_active_at)
  4. When user opens YouTube link, timestamp recorded; on next open, if >2 hours since youtube_open, session_success_inferred logged
**Plans:** 1/2 plans executed

Plans:
- [x] 08-01-PLAN.md — Session lifecycle infrastructure (eager sessionId, rotateSession, syncSession service)
- [ ] 08-02-PLAN.md — Lifecycle hook + YouTube tracking + integration

### Phase 9: Polish
**Goal**: Empty state when pool < 5; settings to edit diet and blocklist
**Depends on**: Phase 8
**Requirements**: SETT-01, SETT-02, SETT-03, SETT-04, EMPT-01, EMPT-02, EMPT-03, EMPT-04
**Success Criteria** (what must be TRUE):
  1. Empty state shown when pool has fewer than 5 recipes after filtering
  2. Empty state shows blob illustration, "Hmm. Nothing here." per design mockup (stitch_screens/6_empty_state.html)
  3. "Reset filters" clears session filters; "Shuffle anyway" re-randomizes with current filters
  4. Settings page accessible from discovery; user can edit diet preference and cuisine blocklist; changes apply to next session
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete    | 2026-03-13 |
| 2. Data Layer | 2/2 | Complete   | 2026-03-13 |
| 3. Onboarding | 2/2 | Complete   | 2026-03-13 |
| 4. Session Setup | 0/1 | Planned | - |
| 5. Recipe Pool | 1/1 | Complete    | 2026-03-13 |
| 6. Discovery Loop | 3/3 | Complete   | 2026-03-13 |
| 7. Recipe Detail + Signal Logging | 3/3 | Complete | 2026-03-13 |
| 8. Session Management + Success Inference | 1/2 | In Progress|  |
| 9. Polish | 0/TBD | Not started | - |
