# Phase 4: Session Setup — Context

**Created:** 2026-03-13
**Source:** discuss-phase conversation

## Locked Decisions

### Scope Change: Cuisine Selection + Ingredient Filter Eliminated

- **No cuisine selection screen** — user is pushed directly to recipes after onboarding
- **No ingredient filter screen** — ingredient filtering deferred to discovery filter bar (Phase 6)
- Filtering happens in-context during discovery, not at session start
- Requirements SESS-01, SESS-02, SESS-03 are **deferred** to Phase 6 (discovery filter bar)
- SESS-04 (session starts immediately) is simplified to auto-start

### Greeting Screen

- **Time-based greeting** shown for ~2 seconds before auto-transitioning to recipe cards
- Greeting text varies by time of day:
  - Morning (5am-12pm): "Good morning."
  - Afternoon (12pm-5pm): "Good afternoon."
  - Evening (5pm-9pm): "Good evening."
  - Night (9pm-5am): "Late night cravings?"
- Headline: "What's for dinner?" (or similar per mockup vibe)
- **2-second auto-transition** — no button tap required, greeting fades/slides into recipe cards
- Greeting follows neo-brutalist design system (large heading font, warm white bg)

### Session Auto-Start

- After greeting, session auto-starts with:
  - `cuisines: []` (all cuisines, no filter)
  - `ingredientFilter: null` (no filter)
  - Diet and blocklist from preferences applied during pool fetch (Phase 5)
- Calls `startSession([], null)` automatically

### Return Visit Behavior

- **Same session return** (tab switch, 10 min away, etc.):
  - Resume at current card position
  - No greeting shown
  - Pool order preserved
  - Check: `session.setupComplete === true` and session not timed out
- **New session** (first visit, or after 4-hr timeout per Phase 8):
  - Show greeting → 2 sec → fresh random shuffle of recipe cards
  - New pool fetched and randomized

### Card Randomization

- Cards are randomized fresh on each new session
- Within a session, card order is fixed (survives page refresh)
- Shuffle button in discovery (Phase 6) re-randomizes mid-session

## Claude's Discretion

- Exact greeting transition animation (fade, slide, or scale — should feel "snap and pop")
- Whether greeting is a separate component or built into the discovery page
- Exact time-of-day thresholds for greeting text
- Night greeting copy (could be "Late night cravings?" or "Midnight munchies?" etc.)

## Deferred Ideas (OUT OF SCOPE for Phase 4)

- Per-session cuisine selection (was SESS-01, SESS-02, SESS-03) → moved to Phase 6 as part of discovery filter bar
- Ingredient filter at session start → moved to Phase 6 filter bar
- "Skip, show me everything" link (no longer needed — everything is shown by default)

## Impact on Downstream Phases

### Phase 5: Recipe Pool
- Pool fetch uses only diet + blocklist as filters (no session cuisine filter)
- `session.cuisines` will be `[]` (empty = all)
- Discovery filter bar (Phase 6) can add runtime cuisine/ingredient filters

### Phase 6: Discovery Loop
- Filter bar becomes the primary way to narrow recipes (cuisine, meal type, ingredient)
- SESS-01 (cuisine pick) and SESS-02 (ingredient) effectively move here as filter bar functionality

### Phase 8: Session Management
- Session timeout (4hr) determines greeting vs resume behavior
- `session.setupComplete` flag still used to distinguish first load vs active session
