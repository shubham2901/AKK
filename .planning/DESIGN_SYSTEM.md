# Aaj Kya Khana Hai — Design System

Every screen, component, and interaction must follow this system. No exceptions.

## Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Primary (Burnt Orange) | `#E8602C` | CTAs, selected states, accents |
| Dark (Charcoal) | `#1C1C1E` | Text, borders, hard shadows |
| Background (Warm White) | `#FFF9F5` | Page background |
| Surface | `#FFFFFF` | Cards, inputs |
| Muted text | `#6B6B6B` | Secondary text, labels |

## Typography

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| Headings | Syne | Bold / Semibold (700/600) | LARGE. Headings take up space. Never small or timid. |
| Body + UI | Plus Jakarta Sans | 400-700 | All non-heading text, buttons, chips, labels |

Headings use tight letter-spacing (`-0.04em`), tight line-height (`0.85-0.9`), uppercase by default.

## Borders & Surfaces

- **Hard borders everywhere.** `2px solid #1C1C1E` on cards, buttons, chips, inputs.
- **Zero drop shadows.** Use hard offset shadows instead: `shadow-[4px_4px_0px_0px_rgba(28,28,30,1)]` for selected/pressed states.
- **Zero rounded softness.** Corners: max `12px` radius. Not more.
- **No gradients** on surfaces (only on photo overlays for text legibility).

## Buttons

- Thick `2px` border, always visible.
- Two styles: **filled** (primary bg + white text) or **outlined** (white bg + charcoal text).
- Never ghost/subtle/borderless.
- Active state: `translate-y-1` + remove shadow (press-down effect).
- Large CTAs: full-width, `py-5`, uppercase Syne text.

## Chips & Tags

- Hard border `2px solid #1C1C1E`.
- Selected: `bg-primary text-white` + hard offset shadow.
- Unselected: `bg-white text-charcoal`.
- Slight rotation on chip clouds (`rotate-1` to `rotate-5`, alternating positive/negative) for zine aesthetic.
- Rounded to `rounded-lg` (max 12px).

## Icons

- Material Symbols Outlined (Google Fonts).
- Use filled variant (`font-variation-settings: 'FILL' 1`) for selected/active states.

## Layout Rules

- **Mobile-first.** Max container width `max-w-md` (448px), centered.
- **Big text is not a mistake, it's a decision.** Headlines can be `text-5xl` to `text-8xl`.
- **Confident whitespace.** Do not fill every pixel. Empty space is intentional.
- **Unexpected layout choices.** Asymmetric tag clouds, oversized headlines that bleed, rotated elements.

## Motion

- **Snap and pop.** Elements snap into place with brief scale bounce.
- Swipe transitions are **physical** — card physically moves off screen with velocity-based follow-through.
- **No slow fades. No dissolves.** Transitions are instant or spring-based.
- Spring config: `stiffness: 300, damping: 30` (snappy, not bouncy).

## Illustration Style

- Bold flat blob illustrations. Thick outlines (`stroke-width: 4`). Flat color fills.
- No gradients on illustrations. Solid blocks of color.
- Warm, chunky, slightly imperfect. NOT clipart. NOT emoji-style.

## Personality References

- **CRED (India)** — bold type, personality-driven, not utilitarian
- **Syne / Framer templates** — hard borders, editorial grid
- **Partiful** — fun, irreverent, not corporate
- **Zine culture** — big text, unexpected layout, confident whitespace
- **NOT Zomato. NOT Swiggy.** We are not a delivery app.

## Anti-Patterns (Never Do)

- Rounded corners > 12px
- Drop shadows (use hard offset shadows only)
- Ghost/borderless buttons
- Small, timid headings
- Gradient fills on UI elements
- Filling every pixel with content
- Delivery app aesthetic (grid of food items, star ratings, price tags)
