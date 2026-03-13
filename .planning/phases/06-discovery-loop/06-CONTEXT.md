# Phase 6: Discovery Loop - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Full-screen swipeable recipe card stack with navigation, shuffle, and filter controls. Users browse one card at a time, swiping to navigate, tapping to open detail (Phase 7). Filter bar lets users narrow by cuisine and meal type. This is the core interaction loop of the app.

</domain>

<decisions>
## Implementation Decisions

### Card layout & content
- **Full-bleed photo** — food image covers entire screen
- **Neo-brutalist text block** at bottom — hard border box with Charcoal text overlaid on card (not white-on-gradient)
- **Standard info** per card: recipe name (Syne heading), one-line hook, 2-3 cuisine/diet chips
- **One card visible at a time** — no peek at next/previous card

### Swipe interaction
- **Both directions** — right/up = next card, left/down = previous card
- **Loop on edges** — last card wraps to first, first card wraps to last
- **Spring physics** — card follows finger, overshoots slightly, settles (playful, not stiff)
- **Short threshold** — ~20% of screen width commits the swipe (fast, easy browsing)

### Filter bar
- **Client-side filtering** — filter the existing 50-recipe pool in memory (no refetch)
- **Two filter types** — cuisine + meal type (breakfast/lunch/dinner/snack)
- **Icon tap trigger** — filter icon in floating chrome; tapping opens bottom sheet with filter options
- **Active filters shown as filled chips** — colored chips appear at top of screen when filters are active

### Navigation chrome
- **Minimal chrome** — shuffle icon + filter icon floating over the card, no header bar
- **Shuffle button top-right** — floating over the card
- **No card position counter** — keep the UI clean
- **Tap anywhere on card** opens Recipe Detail overlay (Phase 7)

### Claude's Discretion
- Exact spring stiffness/damping values for swipe
- Filter bottom sheet layout and animation
- Chip colors and styling within neo-brutalist system
- How shuffle icon looks (Material Symbol choice)
- Exact positioning of floating controls (padding, z-index)

</decisions>

<specifics>
## Specific Ideas

- Card should feel immersive — food photo dominates, text is secondary
- Neo-brutalist text block: hard 2px border, slight offset shadow, max 12px radius — consistent with existing design tokens
- Swipe should feel fast and fluid — users are browsing quickly, not deliberating
- Filter icon should be subtle enough to not distract from the food photo but discoverable
- Reference mockup exists at `stitch_screens/3_recipe_card_immersive.html` for design vibe (not pixel-match)

</specifics>

<deferred>
## Deferred Ideas

- Ingredient filter → could be added later to the filter bottom sheet
- Diet filter in filter bar → user already set diet in onboarding, no need to duplicate here for V0
- Card position indicator (e.g. "3 of 47") → could add later if users want it
- Pagination / load-more on scroll → only 50 recipes for V0

</deferred>

---

*Phase: 06-discovery-loop*
*Context gathered: 2026-03-13*
