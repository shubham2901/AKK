# Requirements: Aaj Kya Khana Hai?

**Defined:** 2026-03-11
**Core Value:** A couple opens the app and leaves with a recipe they want to cook tonight — in under 2 minutes, with zero decision fatigue.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [x] **FOUN-01**: App loads on mobile Chrome/Safari with no white flash or layout jank
- [x] **FOUN-02**: Syne (headings) and Plus Jakarta Sans (body) load without FOUC via next/font
- [x] **FOUN-03**: Design system tokens (colors, borders, radius, shadows) applied globally via Tailwind config
- [x] **FOUN-04**: Mobile-first layout with max-w-md container, touch-friendly targets (min 44px)

### Data Layer

- [x] **DATA-01**: Supabase client configured with anon key for public recipe reads
- [x] **DATA-02**: TypeScript interfaces for Recipe, UserSession, UserInteraction, SessionState
- [x] **DATA-03**: Zustand store for session state (preferences, pool, card index, filters)
- [x] **DATA-04**: Zustand persist middleware syncs session state to localStorage

### Onboarding

- [x] **ONBR-01**: User can select diet preference (Vegetarian / Non-Veg / Vegan) on first launch
- [x] **ONBR-02**: User can select cuisine blocklist (multi-select chips) on first launch
- [x] **ONBR-03**: Onboarding data saved to localStorage and never shown again
- [x] **ONBR-04**: Diet screen shows 3 vertical cards with icons per design mockup
- [x] **ONBR-05**: Blocklist screen shows asymmetric tag cloud with rotated chips per design mockup

### Session Setup

- [ ] **SESS-01**: ~~User selects 1-3 cuisines for this session~~ → Deferred to Phase 6 (discovery filter bar)
- [ ] **SESS-02**: ~~User can optionally select one ingredient filter~~ → Deferred to Phase 6 (discovery filter bar)
- [ ] **SESS-03**: ~~Session cuisine screen shows grid cards~~ → Eliminated (no session setup screen)
- [x] **SESS-04**: Session starts immediately (auto-start after 2-sec greeting)

### Recipe Pool

- [x] **POOL-01**: Recipe pool fetched from Supabase with server-side filters (diet, blocklist, cuisine, ingredient)
- [x] **POOL-02**: Pool randomized on client and order fixed for session duration
- [x] **POOL-03**: Minimum pool size of 5 recipes; empty state shown if fewer
- [x] **POOL-04**: Pool stored in Zustand and survives page refresh within session

### Discovery Loop

- [x] **DISC-01**: Full-screen recipe card with food photo, recipe name (Syne), cuisine/diet chips, one-line hook
- [x] **DISC-02**: Swipe right/up for next card, swipe left/down for previous card
- [x] **DISC-03**: Tap anywhere on card opens Recipe Detail overlay
- [x] **DISC-04**: Shuffle button (top right) re-randomizes pool and resets position to 0
- [x] **DISC-05**: Card swipe uses spring physics (snap and pop, physical movement off screen)
- [x] **DISC-06**: Discovery card layout matches immersive design mockup (full-bleed photo, dark gradient, white text)
- [x] **DISC-07**: Filter bar at bottom with cuisine / meal type / ingredient bottom sheet filters

### Recipe Detail

- [x] **DETL-01**: Recipe detail slides up as overlay over discovery card (not full page nav)
- [x] **DETL-02**: Shows food photo with hard border, recipe name, cuisine/diet chips, one-line hook
- [x] **DETL-03**: "Watch on YouTube" button opens YouTube link in new tab
- [x] **DETL-04**: "Full Recipe" button opens Hebbar's Kitchen web link in new tab
- [x] **DETL-05**: "Found my pick" CTA (full width, Burnt Orange fill) logs found_my_pick, shows toast, changes button to "Picked"
- [x] **DETL-06**: Back arrow returns to discovery at same card position
- [x] **DETL-07**: Recipe detail layout matches editorial design mockup

### Signal Logging

- [x] **LOGG-01**: All user interactions logged silently to user_interactions table in Supabase
- [x] **LOGG-02**: Actions logged: swipe_next, swipe_prev, tap, youtube_open, web_open, found_my_pick, back_no_action, shuffle
- [x] **LOGG-03**: Logging is fire-and-forget (no await, no UI feedback)
- [x] **LOGG-04**: Each log includes session_id, recipe_id, action, timestamp, metadata

### Session Management

- [x] **SMGM-01**: Anonymous session created with UUID on first app open
- [x] **SMGM-02**: Session state (card position, pool order, filters) persists in localStorage across refresh
- [x] **SMGM-03**: New session created after 4 hours of inactivity (based on last_active_at timestamp)
- [x] **SMGM-04**: Session data synced to user_sessions table in Supabase on creation

### Success Inference

- [x] **SINF-01**: When user opens YouTube link, timestamp recorded in localStorage
- [x] **SINF-02**: On next app open, if >2 hours since youtube_open, log session_success_inferred for that recipe

### Settings

- [x] **SETT-01**: Settings page accessible from discovery screen
- [x] **SETT-02**: User can edit diet preference
- [x] **SETT-03**: User can edit cuisine blocklist
- [x] **SETT-04**: Changes apply immediately and trigger pool rebuild on next session

### Empty State

- [x] **EMPT-01**: Empty state shown when pool has fewer than 5 recipes after filtering
- [x] **EMPT-02**: Shows blob illustration, "Hmm. Nothing here." text per design mockup
- [x] **EMPT-03**: "Reset filters" button clears session filters
- [x] **EMPT-04**: "Shuffle anyway" button re-randomizes with current filters

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Personalisation

- **PERS-01**: Recipe pool ranked by past interaction signals (yes, maybe, swipe patterns)
- **PERS-02**: "Used" recipes deprioritized in future sessions

### Vibe System

- **VIBE-01**: 8 vibe categories for mood-based discovery
- **VIBE-02**: Vibe selection at session start as alternative to cuisine pick

### Social

- **SOCL-01**: Partner sync for shared recipe discovery sessions
- **SOCL-02**: "Did you make this?" feedback loop for return visits

### Engagement

- **ENGM-01**: Push notifications for dinner-time nudge
- **ENGM-02**: "Maybe" nudge at session start with previously seen recipes

## Out of Scope

| Feature | Reason |
|---------|--------|
| Search | Contradicts the core no-search philosophy |
| User accounts / login | Anonymous sessions validate the core loop first |
| Meal planning | Different job-to-be-done; scope creep |
| Grocery lists | Different workflow, not discovery |
| Calorie / nutrition data | Not available in source data |
| Native Android / iOS app | Post web PMF validation |
| Recipe import / clipping | Curated source, not personal library |
| Complex filter bar | Slips toward browsing; analysis paralysis |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUN-01 | Phase 1 | Complete |
| FOUN-02 | Phase 1 | Complete |
| FOUN-03 | Phase 1 | Complete |
| FOUN-04 | Phase 1 | Complete |
| DATA-01 | Phase 2 | Complete |
| DATA-02 | Phase 2 | Complete |
| DATA-03 | Phase 2 | Complete |
| DATA-04 | Phase 2 | Complete |
| ONBR-01 | Phase 3 | Complete |
| ONBR-02 | Phase 3 | Complete |
| ONBR-03 | Phase 3 | Complete |
| ONBR-04 | Phase 3 | Complete |
| ONBR-05 | Phase 3 | Complete |
| SESS-01 | Phase 6 | Deferred |
| SESS-02 | Phase 6 | Deferred |
| SESS-03 | — | Eliminated |
| SESS-04 | Phase 4 | Complete |
| POOL-01 | Phase 5 | Complete |
| POOL-02 | Phase 5 | Complete |
| POOL-03 | Phase 5 | Complete |
| POOL-04 | Phase 5 | Complete |
| DISC-01 | Phase 6 | Complete |
| DISC-02 | Phase 6 | Complete |
| DISC-03 | Phase 6 | Complete |
| DISC-04 | Phase 6 | Complete |
| DISC-05 | Phase 6 | Complete |
| DISC-06 | Phase 6 | Complete |
| DISC-07 | Phase 6 | Complete |
| DETL-01 | Phase 7 | Complete |
| DETL-02 | Phase 7 | Complete |
| DETL-03 | Phase 7 | Complete |
| DETL-04 | Phase 7 | Complete |
| DETL-05 | Phase 7 | Complete |
| DETL-06 | Phase 7 | Complete |
| DETL-07 | Phase 7 | Complete |
| LOGG-01 | Phase 7 | Complete |
| LOGG-02 | Phase 7 | Complete |
| LOGG-03 | Phase 7 | Complete |
| LOGG-04 | Phase 7 | Complete |
| SMGM-01 | Phase 8 | Complete |
| SMGM-02 | Phase 8 | Complete |
| SMGM-03 | Phase 8 | Complete |
| SMGM-04 | Phase 8 | Complete |
| SINF-01 | Phase 8 | Complete |
| SINF-02 | Phase 8 | Complete |
| SETT-01 | Phase 9 | Complete |
| SETT-02 | Phase 9 | Complete |
| SETT-03 | Phase 9 | Complete |
| SETT-04 | Phase 9 | Complete |
| EMPT-01 | Phase 9 | Complete |
| EMPT-02 | Phase 9 | Complete |
| EMPT-03 | Phase 9 | Complete |
| EMPT-04 | Phase 9 | Complete |

**Coverage:**
- v1 requirements: 49 total
- Mapped to phases: 49
- Unmapped: 0

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-13 after roadmap creation*
