# Phase 1: Foundation - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

App shell, fonts, design tokens, and mobile-first layout. The visual infrastructure that every subsequent phase builds on. No functional screens — just the foundation that prevents white flash, layout jank, and FOUC.

</domain>

<decisions>
## Implementation Decisions

### Typography
- **Heading font: Syne** — not Clash Display (which appears in mockups as a placeholder). Use Syne with weight 800 (extra bold), tight tracking (-0.04em), and crushed line-height (0.85) for the aggressive, punchy neo-brutalist headline style.
- **Heading casing: mixed** — hero/display headings are uppercase; subheadings and smaller headings use normal case.
- **Body font: Plus Jakarta Sans** — confirmed across all screens.
- Both fonts loaded via `next/font` to prevent FOUC.

### Color Tokens
- **Primary (Burnt Orange):** `#e8612c`
- **Background light:** `#FFF9F5` (warm, peachy cream — this is the canonical value; ignore the #f8f6f6 variant in some mockups)
- **Background dark:** `#211511` (warm dark brown — defined as token but not actively used yet)
- **Ink/Charcoal:** `#181311` (borders, text, shadows)

### Shadow System
- Named shadow tokens mapped to the neo-brutalist offset shadow pattern (solid color, no blur):
  - Small: `4px 4px 0px #181311` (chips, tags)
  - Medium: `6px 6px 0px #181311` (buttons, cards)
  - Large: `8px 8px 0px #181311` (primary CTAs)
- All shadows use Charcoal (#181311) as the shadow color.

### Icons
- **Material Symbols Outlined** — confirmed as the icon system for the app.

### Dark Mode
- **Deferred** — light mode only for Phase 1. Dark mode tokens defined but not wired up.
- When eventually implemented: follow system preference automatically, with selective application (onboarding/setup screens adapt; discovery card stays dark regardless since it uses full-bleed photos).
- Dark background confirmed as `#211511` (warm dark brown, not true black).

### Shell Content
- Phase 1 renders a **branded placeholder page** showing the app name, tagline, and design tokens in action — not a blank shell.
- **App name "Aaj Kya Khana Hai?"** appears as the identity on this placeholder.
- **Instant background color** on load — no white flash. Content appears progressively (no splash screen).
- **Status bar themed** — `theme-color` meta tag matches the app background color.

### Claude's Discretion
- **Design token scope/granularity** — decide whether to include spacing scale, border-radius tokens, border-width tokens, or keep it minimal (colors, fonts, shadows). Use judgment based on what downstream phases will actually need.

</decisions>

<specifics>
## Specific Ideas

- The neo-brutalist style uses consistent 2px borders (`border-2`) across all interactive elements.
- Rounded corners vary by context: `0.5rem` default, `1rem` large, `1.5rem` extra-large, `9999px` full/pill.
- The `max-w-md` container with `mx-auto` centers the mobile layout — some mockups also show side borders (`border-x-2 border-charcoal`) to frame the content area.
- Buttons have an `active:translate-y-1 active:shadow-none` press effect (shadow disappears on press, element shifts down).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-13*
