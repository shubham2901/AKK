# Aaj Kya Khana Hai?

## What This Is

A recipe discovery web app for urban Indian couples aged 25-35. The single job: a couple opens the app in the evening and leaves with a recipe they want to cook tonight. No search, no browsing, no decision fatigue. One recipe at a time, swipe through, find your pick. Data sourced from Hebbar's Kitchen (3,120 YouTube recipes, enriched with LLM metadata and web-scraped recipe details). Starting with 100 recipes for V0.

## Core Value

A couple opens the app and leaves with a recipe they want to cook tonight — in under 2 minutes, with zero decision fatigue.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Onboarding: diet preference selection (Vegetarian / Non-Veg / Vegan), saved to localStorage
- [ ] Onboarding: cuisine blocklist (multi-select chips, permanently excluded), saved to localStorage
- [ ] Session setup: cuisine pick (1-3 cuisines for this session, mandatory)
- [ ] Session setup: ingredient filter (optional, single-select, skippable)
- [ ] Discovery loop: full-screen recipe cards, one at a time, swipe navigation
- [ ] Discovery loop: shuffle button to re-randomize the session pool
- [ ] Discovery loop: filter bar (cuisine / meal type / ingredient) via bottom sheets
- [ ] Recipe detail: slides up over discovery card (overlay, not full page nav)
- [ ] Recipe detail: photo, name, chips, one-line hook, YouTube link, web recipe link
- [ ] Recipe detail: "Found my pick" CTA — logs as "Used", shows toast, button changes to "Picked"
- [ ] Signal logging: all interactions silently logged to Supabase (swipe_next, tap, youtube_open, found_my_pick, etc.)
- [ ] Session persistence: card position + pool order survive page refresh within same session
- [ ] New session after 4 hours of inactivity
- [ ] Success inference: if YouTube opened and user doesn't return for 2 hours, log session_success_inferred
- [ ] Settings page: edit diet preference and cuisine blocklist
- [ ] Empty state: shown when filter results in <5 recipes, with reset/shuffle options
- [ ] Recipe pool filtering: diet + blocklist + session cuisine + ingredient, randomized, min 5 recipes

### Out of Scope

- User login / accounts — anonymous sessions via localStorage UUID for V0
- Partner sync / shared sessions — adds auth complexity
- Push notifications — build after return visit habit confirmed
- Personalisation / ranking engine — needs 30+ sessions of data per user
- Search — contradicts the core no-search philosophy
- Meal planning — not the use case
- Calorie data — not available in source data
- Native Android / iOS app — post web PMF validation
- Vibe system (8 vibes) — V2, needs session data to validate

## Context

- Data pipeline complete: YouTube API scrape (3,120 videos) → LLM enrichment pass 1 (recipe names, diet/cuisine/meal tags) → web scraping (prep/cook time, ingredients, servings) → LLM enrichment pass 2 (main_ingredients, one_line_hook, flavor_profile, vibe_tags, kid_friendly, difficulty, diet re-tagging)
- Design mockups exist as HTML prototypes in `stitch_screens/` — 6 screens covering onboarding, session start, discovery card, recipe detail, and empty state
- Design language is neo-brutalist: hard borders, large Syne headings, Burnt Orange primary, zine-inspired layouts
- Non-Veg filter shows meat/fish/egg recipes only (not all recipes). Eggetarian recipes are tagged both Eggetarian and Non-Veg.
- Hebbar's Kitchen is primarily vegetarian. Non-veg content will be expanded from other sources later.
- "Found my pick" saves as "Used" data for future personalisation.

## Constraints

- **Tech stack**: Next.js 15 App Router, Tailwind CSS v4, Motion (framer-motion), Zustand, Supabase — no Streamlit, no Expo Go, no old/non-scalable tech
- **Font**: Syne for headings (not Clash Display), Plus Jakarta Sans for body
- **Vibe-coding**: libraries must be well-documented, widely used, and manageable by AI coding agents
- **No SSR dependency**: client-side rendering with smooth experience, no white flashes or loading jank
- **Starting dataset**: 100 recipes for V0 build/testing
- **Deployment**: Vercel
- **Database**: Supabase (PostgreSQL), schema already defined

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Syne over Clash Display | Syne is free (Google Fonts), similar bold editorial feel | — Pending |
| No SSR for discovery | Discovery loop is fully client-side; recipe pool fetched with server-side filters, randomized on client | — Pending |
| Motion for swipe | Best-documented gesture library for React; "snap and pop" spring physics | — Pending |
| Recipe detail as overlay not route | Preserves card position in discovery loop; feels like bottom sheet per PRD | — Pending |
| Anonymous sessions (localStorage) | No auth complexity for V0; UUID generated client-side | — Pending |
| Non-Veg = meat + fish + egg only | User requirement; Vegetarian/Vegan show only those tagged recipes | — Pending |
| Start with 100 recipes | Faster iteration on V0; full dataset (3,120) loaded after QC | — Pending |

---
*Last updated: 2026-03-11 after initialization*
