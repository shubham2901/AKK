# Technology Stack

**Project:** Aaj Kya Khana Hai? (AKK)  
**Researched:** 2026-03-13  
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|------------------|
| Next.js | 15.x | React framework, App Router, routing, build | Industry standard for React web apps; Vercel-native; excellent AI agent training data. App Router supports `'use client'` for CSR-heavy pages. Turbopack stable in 15 for fast dev. **Confidence: HIGH** |
| React | 19.x | UI library | Ships with Next.js 15; required for client components. **Confidence: HIGH** |
| TypeScript | 5.x | Type safety | Default in create-next-app; critical for AI agents to infer types and avoid runtime errors. **Confidence: HIGH** |
| Tailwind CSS | 4.x | Utility-first styling | Neo-brutalist design (hard borders, tokens) maps cleanly to utility classes. v4: CSS-first config, faster builds, modern. **Confidence: HIGH** |
| Supabase | latest | Database, auth, realtime | PostgreSQL + REST/Realtime APIs; generous free tier; official Next.js quickstart; ideal for vibe-coding (no backend code). **Confidence: HIGH** |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Motion (framer-motion) | 12.x | Animations, swipe gestures, springs | Discovery cards (drag/swipe), layout transitions, spring physics. Built-in `drag`, `whileTap`, layout animations. **Confidence: HIGH** |
| Zustand | 5.x | Client state management | Session state, recipe pool, filters, UI state. Minimal API, no providers, ~2KB; excellent for AI apps (streaming, optimistic updates). **Confidence: HIGH** |
| @supabase/supabase-js | latest | Supabase client | Data fetching, RLS, anonymous sessions. **Confidence: HIGH** |
| @supabase/ssr | latest | Supabase SSR/cookies | Required for Next.js App Router; cookie-based auth if needed later. **Confidence: HIGH** |

### Typography & Icons

| Asset | Source | Purpose |
|-------|--------|---------|
| Syne | Google Fonts | Headings (neo-brutalist, bold) |
| Plus Jakarta Sans | Google Fonts | Body, UI labels |
| Material Symbols Outlined | @material-symbols-svg/react | Icons (tree-shakable SVG; Outlined style, filled for active) |

**Font loading:** Use `next/font/google` for Syne and Plus Jakarta Sans to avoid FOUC and optimize loading.

**Icons:** Prefer `@material-symbols-svg/react` over webfont — SVG is tree-shakable, smaller bundle, no FOUC. Design system specifies Outlined with filled variant for selected states.

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint | Linting | Default with create-next-app |
| Turbopack | Dev bundler | Default in Next.js 15; 5–10x faster Fast Refresh |
| Vercel | Deployment | Zero-config for Next.js; preview deploys per branch |

---

## Version Notes

### Next.js 14 vs 15 vs 16

| Version | Status | Recommendation |
|---------|--------|----------------|
| Next.js 14 | Supported, stable | Acceptable; user pre-selected. Less Turbopack maturity. |
| Next.js 15 | Stable, recommended | **Use for new projects.** Turbopack stable, 2–3x faster builds, fetch no longer cached by default (simpler mental model for CSR). |
| Next.js 16 | Latest (Feb 2026) | Cutting edge; Cache Components, PPR. Optional for greenfield if you want latest features. |

**Recommendation:** Use **Next.js 15** for new projects. Next.js 14 is fine if you prioritize maximum stability and AI training-data familiarity. Avoid 16 for now unless you need Cache Components — less ecosystem maturity.

### Tailwind v3 vs v4

| Version | Status | Recommendation |
|---------|--------|----------------|
| Tailwind v3 | Mature, widely documented | More AI training data; `tailwind.config.js` familiar to agents. |
| Tailwind v4 | Current (v4.2.x) | CSS-first (`@theme` in CSS), faster builds, modern. New projects should start here. |

**Recommendation:** Use **Tailwind v4** for greenfield. Migration from v3 is straightforward; create-next-app may still scaffold v3 — upgrade with `npx @tailwindcss/upgrade` if needed.

### Motion (formerly Framer Motion)

- **Package:** `motion` (npm) — Framer Motion rebranded to Motion (Nov 2024); `framer-motion` npm package still exists and points to same codebase.
- **Import:** `import { motion } from "motion/react"`
- **Legacy import:** `import { motion } from "framer-motion"` — still works; prefer `motion` for new code.
- **Gestures:** `drag`, `whileTap`, `whileHover`, `onDragEnd` — ideal for swipe-based discovery cards.

---

## Installation

```bash
# Create Next.js app (includes TypeScript, Tailwind, ESLint, App Router)
npx create-next-app@latest aaj-kya-khana-hai --yes

# Core dependencies
npm install motion zustand @supabase/supabase-js @supabase/ssr

# Icons (Material Symbols Outlined as SVG)
npm install @material-symbols-svg/react

# Dev dependencies (usually included by create-next-app)
npm install -D @types/node
```

**Environment variables** (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 15 | Remix, Vite + React Router | If you need different routing model or non-Vercel deployment |
| Motion | Motion One + @use-gesture/react | If bundle size is critical (Motion One ~3.8KB vs Motion ~30KB); more setup for gestures |
| Motion | Embla Carousel / Keen Slider | If you only need carousel/swipe, not general animations |
| Zustand | Jotai, Redux | Jotai for atomic state; Redux for complex devtools/time-travel |
| Tailwind v4 | Tailwind v3 | If you must support older browsers (Safari <16.4) |
| @material-symbols-svg/react | Google Fonts Material Symbols | If you prefer font-based icons (simpler markup, larger initial load) |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Streamlit | Not a web app framework; Python-based, not scalable for production web | Next.js + React |
| Expo Go | User constraint; native app not in scope for V0 | Next.js (PWA if needed) |
| Redux | Overkill for session + UI state; more boilerplate for AI agents | Zustand |
| CSS-in-JS (styled-components, Emotion) | Adds runtime, conflicts with Tailwind; less AI-friendly | Tailwind CSS |
| Swiper.js | 80KB; overkill for single-card swipe; Motion handles gestures | Motion (framer-motion) |
| Old React (17 or earlier) | Incompatible with Next.js 15 | React 19 |
| Pages Router | App Router is default and better for RSC/CSR mix | App Router |

---

## Stack Patterns by Variant

**If client-side only (no SSR):**
- Mark discovery pages with `'use client'`
- Fetch recipe pool in client component or via Route Handler
- Use `dynamic` with `ssr: false` only when necessary (e.g. heavy client-only libs)

**If you add auth later:**
- Use `@supabase/ssr` with cookie-based sessions
- Create server + browser Supabase clients per [Supabase Next.js docs](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

**If bundle size becomes critical:**
- Consider Motion One + @use-gesture/react for swipe-only
- Lazy-load recipe detail overlay

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| next@15 | react@19, react-dom@19 | Default in create-next-app |
| motion@12 | react@^18 \|\| ^19 | Peer deps |
| zustand@5 | react@18+ | Next.js hydration: use `hasHydrated` pattern |
| @supabase/ssr | next@14+ | Cookie-based auth for App Router |
| tailwindcss@4 | Node 20+ | CSS-first; `@import "tailwindcss"` |

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Core framework (Next.js) | HIGH | Official docs, create-next-app, Vercel ecosystem |
| Tailwind | HIGH | Official v4 docs, upgrade guide |
| Motion | HIGH | motion.dev docs, npm 28M+ weekly downloads |
| Zustand | HIGH | Official docs, agent skills, AI-app patterns |
| Supabase | HIGH | Official Next.js quickstart, @supabase/ssr |
| Fonts (Syne, Plus Jakarta Sans) | HIGH | Google Fonts, next/font |
| Icons (Material Symbols) | MEDIUM | SVG package well-documented; font option also valid |

---

## Sources

- [Next.js 15 Release](https://nextjs.org/blog/next-15) — Caching changes, Turbopack
- [Next.js 16 Release](https://nextjs.org/blog/next-16) — Cache Components, PPR
- [Next.js Installation](https://nextjs.org/docs/app/getting-started/installation)
- [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Motion for React (motion.dev)](https://motion.dev/docs/react-quick-start) — Install, import `motion/react`
- [framer-motion npm](https://www.npmjs.com/package/framer-motion) — v12.36.0, Motion rebrand
- [Tailwind v4 Upgrade](https://tailwindcss.com/docs/upgrade-guide)
- [Zustand for AI Applications](https://www.dataa.dev/2025/10/05/frontend-state-management-for-ai-applications-redux-zustand-and-jotai-patterns/)
- [Slop Labs: Vibe Coding Stack](https://sloplabs.dev/articles/how-to-vibecode-app-best-stack) — Supabase, Vercel, Cursor
- [@material-symbols-svg/react](https://www.npmjs.com/package/@material-symbols-svg/react)
- [Syne — Google Fonts](https://fonts.google.com/specimen/Syne)

---
*Stack research for: recipe discovery web app (mobile-first, CSR, Supabase, Vercel)*  
*Researched: 2026-03-13*
