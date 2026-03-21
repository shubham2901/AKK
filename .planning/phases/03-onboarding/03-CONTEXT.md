# Phase 3: Onboarding — Context

**Created:** 2026-03-13
**Source:** discuss-phase conversation

## Locked Decisions

### Routing
- **State-based onboarding** — conditional rendering in `page.tsx`, not route-based
- Check `preferences.onboardingComplete` from Zustand store; if false, render onboarding flow
- No `/onboarding/*` routes; onboarding is a gate, not a destination

### Fonts
- **Keep Sour Gummy** as heading font (do not switch to Syne)
- Font must be defined in exactly one place (CSS variable `--font-heading`) so swapping later is a single-line change
- Body font: Plus Jakarta Sans (already set up)

### Cuisine List
- **Hardcoded curated list** of ~15 cuisines for the blocklist screen
- No Supabase fetch during onboarding — must be instant, no spinners
- Group niche regional cuisines under broader labels:
  - Andhra, Tamil, Udupi, Mangalorean → represented by "South Indian"
  - Karnataka, Konkani → represented by "South Indian"
  - Hyderabadi → keep separate (distinct enough)
  - Bihari → drop (too few recipes)
  - "Indian", "Other" → drop from blocklist (too generic)
- Final curated list (~15): North Indian, South Indian, Punjabi, Gujarati, Rajasthani, Bengali, Maharashtrian, Kerala, Hyderabadi, Chinese, Indo-Chinese, Italian, Street Food, Fusion, Mughlai

### Design Fidelity
- **Mockups are reference, not spec** — match the vibe (neo-brutalist, big headlines, rotated chips) but don't pixel-match
- Step numbering: "Step 1 of 2" and "Step 2 of 2" (not "Step 1 of 3" from mockup)
- Diet screen step 1: no back arrow (nowhere to go back to); use spacer for layout balance
- Cuisine blocklist: "Skip" option available (user can choose to exclude nothing)

### Animation
- Motion library (framer-motion successor) needed for:
  - Transition between diet → blocklist screens
  - Card selection bounce animation
  - Button press effects
- Spring config per design system: stiffness 300, damping 30

## Claude's Discretion

- Exact component file structure within `app/` or `components/`
- Whether to split onboarding into sub-components or keep as one component
- Chip rotation values (follow design system: rotate-1 to rotate-5, alternating positive/negative)
- Icon choices for diet cards (eco, kebab_dining, potted_plant from mockup are good defaults)
- Whether "Skip" on blocklist is a text link or a styled button

## Deferred Ideas (OUT OF SCOPE)

- Eggetarian as a separate diet option (V2)
- Allergen/ingredient blocklist (different from cuisine blocklist)
- Animated onboarding illustrations
- Welcome/splash screen before diet selection
