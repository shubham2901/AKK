# Phase 1: Foundation - Research

**Researched:** 2026-03-13
**Domain:** Next.js app shell, design tokens, font loading, mobile-first layout
**Confidence:** HIGH

## Summary

Phase 1 establishes the visual infrastructure: app shell with neo-brutalist design tokens, fonts loaded without FOUC, no white flash on load, and mobile-first layout. The stack is already defined (Next.js 15, Tailwind v4, next/font). Research focuses on *how* to implement these requirements correctly.

**Key findings:**
- **White flash prevention:** Inline `style={{ backgroundColor: '#FFF9F5' }}` on `<body>` in root layout ensures the background is in the HTML stream before any CSS loads. This is the most reliable approach for light-only Phase 1.
- **Fonts:** Use `next/font/google` with `variable` for both Syne and Plus Jakarta Sans. Apply Syne via `className` on `html` and expose Plus Jakarta Sans as `--font-body`; or apply both via `className` on `html` and use Tailwind `@theme` to map `--font-sans` to the body font. Syne supports weight 800 (variable font range `400 800`).
- **Design tokens:** Tailwind v4 `@theme` directive defines colors, shadows, radius, and fonts. Include a minimal spacing scale and border-radius tokens—downstream phases (buttons, chips, cards) will need them.
- **theme-color:** Add `<meta name="theme-color" content="#FFF9F5">` in layout metadata for mobile status bar theming. Use hex for maximum compatibility.

**Primary recommendation:** Use inline body background + `next/font` with CSS variables + Tailwind v4 `@theme` for tokens. Do not hand-roll font loading or critical CSS extraction.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Typography:** Syne (weight 800, -0.04em tracking, 0.85 line-height) for headings; Plus Jakarta Sans for body. Both via next/font. Heading casing: hero/display uppercase; subheadings normal case.
- **Color Tokens:** Primary #e8612c, Background light #FFF9F5, Background dark #211511, Ink/Charcoal #181311.
- **Shadow System:** Small 4px 4px 0px #181311, Medium 6px 6px 0px #181311, Large 8px 8px 0px #181311.
- **Icons:** Material Symbols Outlined.
- **Dark Mode:** Deferred. Light mode only for Phase 1.
- **Shell Content:** Branded placeholder with app name "Aaj Kya Khana Hai?", tagline, design tokens in action. Instant background color, no white flash. theme-color meta tag.
- **Layout:** max-w-md container, mobile-first.

### Claude's Discretion
- **Design token scope/granularity** — decide whether to include spacing scale, border-radius tokens, border-width tokens, or keep it minimal (colors, fonts, shadows). Use judgment based on what downstream phases will actually need.

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUN-01 | App loads on mobile Chrome/Safari with no white flash or layout jank | Inline body background; next/font with adjustFontFallback; theme-color meta; no layout shift patterns |
| FOUN-02 | Syne (headings) and Plus Jakarta Sans (body) load without FOUC via next/font | next/font/google self-hosts, zero layout shift; use variable + className; Syne weight 800 supported |
| FOUN-03 | Design system tokens (colors, borders, radius, shadows) applied globally via Tailwind config | Tailwind v4 @theme for --color-*, --shadow-*, --radius-*, --font-*; extend or override defaults |
| FOUN-04 | Mobile-first layout with max-w-md container, touch-friendly targets (min 44px) | max-w-md mx-auto; min-h-[44px] or min touch target 44×44px; Apple HIG / WCAG 2.5.5 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.x | App framework, App Router, routing | STACK.md; create-next-app; Turbopack stable |
| React | 19.x | UI library | Ships with Next.js 15 |
| TypeScript | 5.x | Type safety | Default in create-next-app |
| Tailwind CSS | 4.x | Design tokens, utility classes | CSS-first @theme; neo-brutalist maps to utilities |

### Fonts (built-in)
| Asset | Source | Purpose |
|-------|--------|---------|
| Syne | next/font/google | Headings (weight 800) |
| Plus Jakarta Sans | next/font/google | Body, UI |

**Installation:**
```bash
npx create-next-app@latest aaj-kya-khana-hai --yes
# Tailwind v4: if create-next-app scaffolds v3, run:
# npx @tailwindcss/upgrade
```

## Architecture Patterns

### Recommended Project Structure (Phase 1 scope)
```
app/
├── layout.tsx          # Root layout: fonts, body bg, theme-color, ErrorBoundary
├── page.tsx            # Branded placeholder (app name, tagline, tokens demo)
├── globals.css         # @import "tailwindcss"; @theme { ... }
```

### Pattern 1: Root Layout — No White Flash
**What:** Inline background color on body; theme-color meta; fonts applied to html.
**When:** Always. This is the primary FOUN-01 mitigation.
**Example:**
```tsx
// app/layout.tsx
import { Syne, Plus_Jakarta_Sans } from 'next/font/google'

const syne = Syne({
  weight: ['400', '800'],
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata = {
  themeColor: '#FFF9F5',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${plusJakarta.variable}`}>
      <body
        className={plusJakarta.className}
        style={{ backgroundColor: '#FFF9F5' }}
      >
        {children}
      </body>
    </html>
  )
}
```
**Source:** [Next.js Font API](https://nextjs.org/docs/app/api-reference/components/font), [GitHub Discussion #26741](https://github.com/vercel/next.js/discussions/26741)

**Why inline style on body:** The background color is in the HTML stream. No external CSS required. Browser paints #FFF9F5 immediately. Avoids white flash regardless of CSS load order.

### Pattern 2: Tailwind v4 @theme for Design Tokens
**What:** Define colors, shadows, radius, fonts in `@theme` block in globals.css.
**When:** Phase 1 and all subsequent phases.
**Example:**
```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Colors */
  --color-primary: #e8612c;
  --color-charcoal: #181311;
  --color-bg-light: #FFF9F5;
  --color-bg-dark: #211511;

  /* Shadows (neo-brutalist: offset, no blur) */
  --shadow-small: 4px 4px 0px #181311;
  --shadow-medium: 6px 6px 0px #181311;
  --shadow-large: 8px 8px 0px #181311;

  /* Radius */
  --radius-default: 0.5rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-full: 9999px;

  /* Fonts (reference next/font CSS vars) */
  --font-heading: var(--font-syne), ui-sans-serif, sans-serif;
  --font-sans: var(--font-body), ui-sans-serif, sans-serif;
}
```
**Source:** [Tailwind v4 Theme](https://tailwindcss.com/docs/theme)

### Pattern 3: Multiple Fonts via next/font variable
**What:** Use `variable` to expose CSS variable; apply one font via `className` on body, use the other via `font-heading` utility.
**When:** Two fonts (heading + body).
**Example:**
```tsx
// Syne for headings: font-heading or font-[family-name:var(--font-syne)]
// Plus Jakarta for body: className on body
<h1 className="font-heading font-extrabold tracking-tight leading-[0.85] uppercase">
  Aaj Kya Khana Hai?
</h1>
```

### Anti-Patterns to Avoid
- **Don't use external font CDN (Google Fonts link):** Causes FOUC and layout shift. Use next/font only.
- **Don't rely on Tailwind body class for background:** If CSS loads after HTML, white flash occurs. Inline style is safer.
- **Don't use next-themes for Phase 1:** Dark mode is deferred; adds complexity with no benefit.
- **Don't use `display: 'optional'` for fonts:** Can cause invisible text if font fails. Use `swap` (default).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font loading | Custom @font-face + preload | next/font | Self-hosting, size-adjust fallback, zero CLS |
| Critical CSS extraction | Manual inline critical CSS | Inline body style + Tailwind | Body bg is the critical path; full extraction is complex |
| Design tokens | Manual CSS variables + Tailwind config | Tailwind v4 @theme | Automatic utility generation, single source of truth |
| theme-color | Manual meta tag | metadata.themeColor in layout | Next.js generates correct meta |

**Key insight:** next/font and Tailwind @theme solve the hard problems (font metrics, utility generation). Custom solutions introduce edge cases (CLS, FOUC, maintenance).

## Common Pitfalls

### Pitfall 1: White Flash from Delayed CSS
**What goes wrong:** Body renders white until Tailwind CSS loads. User sees brief white flash on mobile.
**Why it happens:** HTML arrives first; CSS is in separate file. Browser paints default white background.
**How to avoid:** Inline `style={{ backgroundColor: '#FFF9F5' }}` on `<body>` in root layout. No external dependency.
**Warning signs:** Testing only on fast connections; not testing on throttled 3G.

### Pitfall 2: Font FOUC / Layout Shift
**What goes wrong:** Text reflows when Syne or Plus Jakarta loads; CLS increases.
**Why it happens:** Using Google Fonts link instead of next/font; or not using adjustFontFallback.
**How to avoid:** Use next/font exclusively. Default `adjustFontFallback: true` matches fallback metrics. Apply fonts at layout level.
**Warning signs:** Layout shift in Lighthouse; text "jumping" during load.

### Pitfall 3: theme-color Ignored on iOS
**What goes wrong:** Status bar stays default color on Safari iOS.
**Why it happens:** Safari added theme-color in v15; some edge cases remain. Use hex, not advanced color functions.
**How to avoid:** Use hex (`#FFF9F5`). Avoid `oklch()`, `lab()`, alpha in theme-color. Set in metadata.
**Warning signs:** Status bar not matching app background on real device.

### Pitfall 4: Touch Targets Too Small
**What goes wrong:** Buttons/chips under 44px cause mis-taps on mobile.
**Why it happens:** Design mockups use desktop sizes; AI-generated code often uses `py-2 px-3` (32px height).
**How to avoid:** Enforce `min-h-[44px] min-w-[44px]` for interactive elements. Use `p-3` (12px) minimum padding for 44px total.
**Warning signs:** Users complaining about "hard to tap" on mobile; failed tap targets in Lighthouse.

### Pitfall 5: Tailwind v4 vs v3 Config
**What goes wrong:** Using `tailwind.config.js` for theme in v4 project; tokens not applied.
**Why it happens:** Tailwind v4 uses CSS-first `@theme`; config file is deprecated for theme.
**How to avoid:** Define all design tokens in `@theme` block in globals.css. No theme extension in config.
**Warning signs:** Custom colors not generating utilities; `bg-primary` not found.

## Code Examples

### theme-color in Next.js App Router
```tsx
// app/layout.tsx
export const metadata = {
  themeColor: '#FFF9F5',
}
```
Next.js 15 generates: `<meta name="theme-color" content="#FFF9F5">`

**Source:** [Next.js Metadata](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/theme-color)

### Syne with Weight 800
```tsx
import { Syne } from 'next/font/google'

const syne = Syne({
  weight: ['400', '800'],  // or '400 800' for variable
  subsets: ['latin'],
  variable: '--font-syne',
})
```
**Source:** [next/font API](https://nextjs.org/docs/app/api-reference/components/font), [Syne Google Fonts](https://fonts.google.com/specimen/Syne)

### Tailwind v4 Custom Shadow
```css
@theme {
  --shadow-brutalist-sm: 4px 4px 0px #181311;
  --shadow-brutalist-md: 6px 6px 0px #181311;
  --shadow-brutalist-lg: 8px 8px 0px #181311;
}
```
Usage: `shadow-brutalist-md`

### Branded Placeholder Page Structure
```tsx
// app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto">
      <h1 className="font-heading text-4xl font-extrabold tracking-[-0.04em] leading-[0.85] uppercase text-charcoal">
        Aaj Kya Khana Hai?
      </h1>
      <p className="font-sans text-lg text-charcoal/80 mt-4">
        Tagline here
      </p>
      {/* Token demo: chips, button, shadow samples */}
    </main>
  )
}
```

## Design Token Scope Recommendation (Claude's Discretion)

**Recommendation: Include spacing, radius, border-width.**

| Token Type | Include? | Rationale |
|------------|-----------|-----------|
| Colors | Yes | Locked in CONTEXT |
| Shadows | Yes | Locked in CONTEXT |
| Fonts | Yes | Locked in CONTEXT |
| Spacing scale | Yes, minimal | Buttons need `p-3` (12px) for 44px; cards need consistent gaps. Use default Tailwind scale or add `--spacing-touch: 0.75rem` (12px) for min padding. |
| Border radius | Yes | 0.5rem, 1rem, 1.5rem, 9999px — buttons, chips, cards all use these. |
| Border width | Optional | CONTEXT specifies 2px everywhere. Can use `border-2` directly; or add `--border-width-brutalist: 2px` for semantic clarity. |

**Minimal approach:** Colors, shadows, radius, fonts. Spacing from Tailwind defaults.
**Recommended:** Add `--radius-*` overrides for default, lg, xl, full. Spacing: use Tailwind defaults (`p-3` = 12px gives 44px with `min-h-[44px]`).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwind.config.js theme | @theme in CSS | Tailwind v4 (2024) | Theme lives in CSS; no JS config for design tokens |
| Google Fonts link | next/font | Next.js 13 (2022) | Self-hosted, zero layout shift |
| next-themes for dark mode | Deferred | Phase 1 | Light only; no theme provider needed |

**Deprecated/outdated:**
- `@next/font` package: Use `next/font` (built-in). The package was merged into Next.js.
- `tailwind.config.js` theme.extend for new projects: Use `@theme` in Tailwind v4.

## Open Questions

1. **Material Symbols in Phase 1 placeholder**
   - What we know: Icons confirmed for app; Phase 1 renders branded placeholder.
   - What's unclear: Does placeholder need icons (e.g., decorative)? Or defer icon setup to Phase 3 (Onboarding)?
   - Recommendation: Phase 1 can ship without icons if placeholder is text + token demo only. Add `@material-symbols-svg/react` when first icon is needed (Phase 3). Document in plan.

2. **Error Boundary placement**
   - What we know: ARCHITECTURE.md mandates app-level Error Boundary from Phase 1.
   - What's unclear: Whether planner treats this as Phase 1 or separate task.
   - Recommendation: Include Error Boundary in Phase 1 scope; wrap `{children}` in root layout.

## Sources

### Primary (HIGH confidence)
- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) — next/font usage
- [Next.js Font API](https://nextjs.org/docs/app/api-reference/components/font) — weight, variable, display
- [Tailwind v4 Theme](https://tailwindcss.com/docs/theme) — @theme directive, namespaces
- [Next.js Metadata themeColor](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/theme-color) — status bar

### Secondary (MEDIUM confidence)
- [GitHub #26741 — White flash prevention](https://github.com/vercel/next.js/discussions/26741)
- [theme-color MDN / media attribute](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMetaElement/media)
- Project: `.planning/research/STACK.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md`

### Tertiary (LOW confidence)
- WebSearch: next/font multiple fonts CSS variable — pattern verified via official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — STACK.md + official Next.js/Tailwind docs
- Architecture: HIGH — Next.js layout patterns, Tailwind v4 @theme
- Pitfalls: HIGH — Documented in PITFALLS.md; white flash/font patterns from official sources

**Research date:** 2026-03-13
**Valid until:** 30 days (stable stack)
