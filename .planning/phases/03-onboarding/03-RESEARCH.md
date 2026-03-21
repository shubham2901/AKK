# Phase 3: Onboarding - Research

**Researched:** 2026-03-13
**Domain:** Motion animations, Material Symbols icons, onboarding UX patterns, cuisine data curation
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Routing
- State-based conditional rendering, not route-based
- `preferences.onboardingComplete` gates display

#### Fonts
- Keep Sour Gummy as heading font
- Font defined via CSS variable `--font-heading` — single point of change

#### Cuisine List
- Hardcoded ~15 curated cuisines, no Supabase fetch during onboarding
- Niche cuisines grouped under broader labels

#### Design Fidelity
- Mockups are reference, not spec — match the vibe, not pixels
- Step numbering: "Step 1 of 2", "Step 2 of 2"

### Claude's Discretion

- Component file structure
- Chip rotation values
- Icon choices for diet cards
- Skip button styling on blocklist

### Deferred Ideas (OUT OF SCOPE)

- Eggetarian diet option
- Allergen/ingredient blocklist
- Animated illustrations
- Welcome/splash screen

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ONBR-01 | User can select diet preference (Vegetarian / Non-Veg / Vegan) on first launch | Single-select from 3 vertical cards; `setDiet()` in Zustand |
| ONBR-02 | User can select cuisine blocklist (multi-select chips) on first launch | Asymmetric tag cloud; `setBlocklist()` in Zustand |
| ONBR-03 | Onboarding data saved to localStorage and never shown again | `completeOnboarding()` sets flag; persist middleware handles storage |
| ONBR-04 | Diet screen shows 3 vertical cards with icons per design mockup | Vertical flex cards with Material Symbols icons, selected state with shadow |
| ONBR-05 | Blocklist screen shows asymmetric tag cloud with rotated chips per design mockup | Flex-wrap with rotate transforms; selected = primary bg + shadow |

</phase_requirements>

## Summary

Phase 3 builds the two-screen onboarding gate: diet preference selection (3 vertical cards) and cuisine blocklist (asymmetric tag cloud). Both screens are client components rendered conditionally based on `preferences.onboardingComplete` in the Zustand store. The `motion` library provides spring-based transitions between screens and tap animations on interactive elements. Material Symbols Outlined icons are loaded via Google Fonts CDN for the diet card icons.

The onboarding flow is: Diet → Blocklist → done. User can skip the blocklist (exclude nothing). After completion, `completeOnboarding()` is called, the onboarding UI never renders again, and the app proceeds to the session setup flow (Phase 4).

**Primary recommendation:** Build as a single `OnboardingFlow` component with internal step state (0 = diet, 1 = blocklist). Use `AnimatePresence` from motion for slide transitions between steps. Keep the curated cuisine list as a constant array — no network calls.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| motion | latest (v12+) | Spring animations, AnimatePresence, gesture support | Official successor to framer-motion; `import { motion } from "motion/react"`; React 19 compatible |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Material Symbols Outlined | Google Fonts CDN | Icons for diet cards, navigation arrows | Load via `<link>` in layout.tsx; variable font with FILL axis |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| motion (framer-motion) | CSS transitions | CSS can't do spring physics, AnimatePresence exit animations, or gesture velocity |
| Material Symbols CDN | @material-symbols-svg/react SVG package | SVG package is tree-shakable but adds build complexity; CDN is simpler for V0 with ~6 icons |
| Hardcoded cuisine list | Supabase DISTINCT query | Network call during onboarding adds spinner/delay; hardcoded is instant |

**Installation:**

```bash
npm install motion
```

Material Symbols loaded via CDN link in layout.tsx (no npm package):
```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1" rel="stylesheet" />
```

## Architecture Patterns

### Recommended Project Structure

```
app/
├── page.tsx                    # Gates: onboarding vs placeholder (later: session)
components/
├── onboarding/
│   ├── OnboardingFlow.tsx      # Step state machine (diet → blocklist)
│   ├── DietStep.tsx            # 3 vertical cards, single-select
│   └── BlocklistStep.tsx       # Asymmetric tag cloud, multi-select
```

### Pattern 1: State-Based Onboarding Gate

**What:** Main page checks `preferences.onboardingComplete` and renders onboarding or main app content.
**When to use:** One-time flows that should never be revisitable.
**Example:**

```tsx
'use client'
import { useSessionStore } from '@/stores/session-store'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'

export default function Home() {
  const onboardingComplete = useSessionStore((s) => s.preferences.onboardingComplete)
  const hasHydrated = useSessionStore((s) => s._hasHydrated)

  if (!hasHydrated) return null // prevent flash before localStorage loads

  if (!onboardingComplete) return <OnboardingFlow />

  return <main>/* session setup / discovery — later phases */</main>
}
```

### Pattern 2: Step Machine with AnimatePresence

**What:** Internal step state (number) drives which screen to render; AnimatePresence handles exit/enter animations.
**When to use:** Multi-step flows with transitions.
**Example:**

```tsx
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

function OnboardingFlow() {
  const [step, setStep] = useState(0)

  return (
    <AnimatePresence mode="wait">
      {step === 0 && (
        <motion.div
          key="diet"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <DietStep onNext={() => setStep(1)} />
        </motion.div>
      )}
      {step === 1 && (
        <motion.div
          key="blocklist"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <BlocklistStep onComplete={() => { /* save and complete */ }} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### Pattern 3: Neo-Brutalist Selected State

**What:** Selected card/chip gets primary bg, white text, and hard offset shadow. Unselected has white bg, charcoal text, no shadow.
**When to use:** All interactive selection UI in this app.
**Example:**

```tsx
// Selected
className="bg-primary text-white border-2 border-charcoal shadow-medium"
// Unselected
className="bg-white text-charcoal border-2 border-charcoal"
// Press effect
className="active:translate-y-1 active:shadow-none transition-all"
```

### Anti-Patterns to Avoid

- **Router-based onboarding:** Don't create `/onboarding` routes — the flow is a one-time gate, not a destination. URL exposure lets users navigate back.
- **Fetching cuisines from Supabase during onboarding:** Adds a spinner to a flow that should be instant.
- **Persisting onboarding step:** If the user closes mid-onboarding, restart from step 0. Don't persist partial progress — the flow is <30 seconds.
- **Blocking on animation completion:** Don't await animation promises; let motion handle timing via AnimatePresence mode="wait".

## Curated Cuisine List

Based on distinct `cuisine_tags` values in the recipe data, grouped for user clarity:

```typescript
const CUISINES = [
  'North Indian',
  'South Indian',
  'Punjabi',
  'Gujarati',
  'Rajasthani',
  'Bengali',
  'Maharashtrian',
  'Kerala',
  'Hyderabadi',
  'Mughlai',
  'Chinese',
  'Indo-Chinese',
  'Italian',
  'Street Food',
  'Fusion',
] as const
```

**Grouping rationale:**
- Andhra, Tamil, Udupi, Mangalorean, Karnataka, Konkani → "South Indian" (umbrella)
- Bihari → dropped (too few recipes in V0 dataset)
- "Indian", "Other" → dropped (too generic for a blocklist)
- Mughlai → kept (distinct culinary identity, meaningful filter)

## Common Pitfalls

### Pitfall 1: Hydration Flash

**What goes wrong:** Zustand hasn't rehydrated from localStorage yet, so `onboardingComplete` is `false` on first render even for returning users — they briefly see the onboarding screen.
**How to avoid:** Gate on `_hasHydrated`. Return `null` (or a loading skeleton matching bg color) until hydration completes. This takes <50ms in practice.

### Pitfall 2: Material Symbols FOUT

**What goes wrong:** Icons render as text ("eco", "kebab_dining") before the font loads.
**How to avoid:** Set `opacity-0` on icon spans until font loads, or accept the brief flash (neo-brutalist aesthetic is forgiving). For V0, accept it — the font loads fast from Google CDN.

### Pitfall 3: AnimatePresence Key Mismatch

**What goes wrong:** Exit animation doesn't play because the key didn't change or mode isn't set.
**How to avoid:** Every child of AnimatePresence needs a unique `key` prop. Use `mode="wait"` so the exiting element animates out before the entering one comes in.

### Pitfall 4: Touch Target Size

**What goes wrong:** Chips/cards are too small on mobile; users mis-tap.
**How to avoid:** Per design system, minimum 44px touch targets. Chips need `min-h-[44px]` and adequate padding.

## Code Examples

### Motion Import (v12+)

```typescript
// Correct import for motion v12+ (NOT framer-motion)
import { motion, AnimatePresence } from 'motion/react'
```

### Hydration Gate

```tsx
const hasHydrated = useSessionStore((s) => s._hasHydrated)
if (!hasHydrated) return null
```

### Chip Rotation Pattern

```tsx
const ROTATIONS = ['rotate-[2deg]', '-rotate-[1.5deg]', 'rotate-[3deg]', '-rotate-[2.5deg]', 'rotate-[1deg]']

function getRotation(index: number) {
  return ROTATIONS[index % ROTATIONS.length]
}
```

## Sources

### Primary (HIGH confidence)

- [Motion installation guide](https://motion.dev/docs/react-installation) — npm install motion, import from motion/react
- [Motion AnimatePresence](https://motion.dev/docs/react-animate-presence) — exit animations, mode="wait"
- [Material Symbols Guide](https://fonts.google.com/icons) — CDN link, variable font axes
- Zustand store (session-store.ts) — setDiet, setBlocklist, completeOnboarding actions already exist

### Secondary (MEDIUM confidence)

- Design mockups (stitch_screens/2_diet_preference.html, 1_cuisine_exclusions.html) — layout reference
- Design system (.planning/DESIGN_SYSTEM.md) — colors, borders, motion config

## Metadata

**Confidence breakdown:**
- Motion library: HIGH — official docs, React 19 compatible since v12
- Architecture: HIGH — patterns from prior phases and Zustand docs
- Cuisine list: HIGH — derived from actual recipe data
- Design: MEDIUM — mockups are reference, not pixel-spec

**Research date:** 2026-03-13
**Valid until:** 2026-04-13
