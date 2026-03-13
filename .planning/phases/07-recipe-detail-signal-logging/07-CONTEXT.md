# Phase 7: Recipe Detail + Signal Logging - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Recipe detail overlay over the discovery card stack. User taps a card to see full recipe info, YouTube/web links, and a "Found my pick" CTA. All user interactions (swipe, tap, link opens, picks, shuffle) are logged fire-and-forget to Supabase. No full-page navigation — overlay only.

</domain>

<decisions>
## Implementation Decisions

### Overlay behavior & dismissal
- Almost-full-screen slide-up — leaves a sliver of the discovery card peeking at the top
- Opaque background (no dimmed backdrop behind the overlay)
- Dismissible via both back arrow (top-left, per mockup) AND swipe-down gesture
- Native scroll within the overlay; "Found my pick" CTA stays sticky at bottom

### Link presentation & missing data
- Full-width cards with icons, matching the mockup style (play icon for YouTube, book icon for web)
- If a recipe has no web recipe URL (extracted from description), show only the YouTube card — no disabled/grayed-out state
- Links open in a new browser tab (on mobile this triggers native app handling — YouTube app, etc.)
- Must show source attribution (channel name or video title) — extract from available data, don't use generic labels

### "Found my pick" experience
- After tapping: button changes to "Picked ✓" state, user stays on the detail view
- Haptic feedback + color shift on the button for a satisfying delight moment
- User can tap the "Picked" button again to un-pick (toggle behavior)
- Multiple picks allowed per session — user can shortlist several recipes

### Card-to-detail transition
- Entry: slide up from bottom (standard sheet animation)
- Exit: slide down (reverse of entry)
- Picked recipes show a small badge/checkmark on the discovery card
- Viewed recipes (tapped into detail) show a subtle visual change on the card (slight dim or seen indicator)

### Claude's Discretion
- Slide-up animation timing and spring physics
- Exact haptic feedback implementation (Vibration API availability)
- How to extract web recipe URLs from the description field (regex pattern for common recipe blog URLs)
- Loading/error states within the overlay
- Typography and spacing details beyond the mockup reference
- Which fields to gracefully hide when recipe data is null (e.g., missing cook_time, difficulty)

</decisions>

<specifics>
## Specific Ideas

- Layout follows the editorial mockup (`stitch_screens/5_recipe_detail_editorial.html`): back arrow nav → hero image (hard-border, rounded-xl) → large display-font title → meta chips (time, difficulty, cuisine) → hook text → divider → link cards → sticky CTA
- The peek of the discovery card at the top reinforces that this is an overlay, not a new page
- "Found my pick" toggle means the discovery loop isn't over after one pick — users browse freely and curate a shortlist
- Source attribution matters: "YouTube / Kunal Kapur" and "Hebbar's Kitchen" style, not generic "Watch Video"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-recipe-detail-signal-logging*
*Context gathered: 2026-03-13*
