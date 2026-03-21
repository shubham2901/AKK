# Phase 4: Session Setup - Research

**Researched:** 2026-03-13
**Domain:** Greeting splash, auto-session-start, return visit detection
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Scope Reduction
- No cuisine selection screen (deferred to Phase 6 filter bar)
- No ingredient filter screen (deferred to Phase 6 filter bar)
- Phase is just: greeting splash → auto-start session

#### Greeting
- Time-based greeting (morning / afternoon / evening / night)
- 2-second auto-transition, no button required
- Headline: "What's for dinner?" per mockup vibe

#### Session Flow
- New session: greeting → 2 sec → auto-start → discovery placeholder
- Same-session return: skip greeting, resume at current position
- Session auto-starts with cuisines=[], ingredientFilter=null

### Claude's Discretion

- Greeting transition animation style
- Whether greeting is a separate component or inline in page.tsx
- Time-of-day thresholds and exact copy
- Whether to use setTimeout or motion's onAnimationComplete for 2-sec timing

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SESS-04 | Session starts immediately after setup completes | Auto-start after 2-sec greeting; `startSession([], null)` called automatically |

**Deferred to Phase 6:**
- SESS-01: Cuisine selection → discovery filter bar
- SESS-02: Ingredient filter → discovery filter bar
- SESS-03: Grid cards mockup → N/A (screen eliminated)

</phase_requirements>

## Summary

Phase 4 is now a lightweight "session start" phase. After onboarding, users see a time-based greeting splash for 2 seconds, then auto-transition to recipe discovery. No user input required. On same-session return visits (tab switch, brief absence), the greeting is skipped and users resume at their current card position.

The implementation requires: a `GreetingSplash` component, updated `page.tsx` flow logic (hydration → onboarding → session check → greeting or resume), and calling `startSession([], null)` automatically after the greeting.

**Primary recommendation:** Build greeting as a standalone component with `useEffect` timer. Use motion's `AnimatePresence` for the greeting-to-discovery transition. Check `session.setupComplete` to distinguish new session vs return visit.

## Standard Stack

No new libraries needed. Uses motion (already installed) and Zustand (already installed).

## Architecture Patterns

### Recommended Project Structure

```
components/
├── session/
│   └── GreetingSplash.tsx      # Time-based greeting with auto-dismiss
app/
├── page.tsx                    # Updated flow: onboarding → greeting → discovery
```

### Pattern 1: Page Flow Logic

**What:** page.tsx becomes a state machine: hydration → onboarding → session → discovery.

```tsx
// page.tsx flow
if (!hasHydrated) return null
if (!onboardingComplete) return <OnboardingFlow />
if (!session.setupComplete) return <GreetingSplash onComplete={handleSessionStart} />
return <DiscoveryPlaceholder />  // replaced in Phase 5/6
```

### Pattern 2: Greeting with Auto-Dismiss

**What:** Component renders greeting, starts a timer, calls onComplete after 2 seconds.

```tsx
function GreetingSplash({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* greeting content */}
    </motion.div>
  )
}
```

### Pattern 3: Time-Based Greeting

```typescript
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good morning.'
  if (hour >= 12 && hour < 17) return 'Good afternoon.'
  if (hour >= 17 && hour < 21) return 'Good evening.'
  return 'Late night cravings?'
}
```

### Anti-Patterns to Avoid

- **Awaiting startSession before showing discovery:** Call startSession, then let the Zustand re-render handle the transition reactively.
- **Using setInterval instead of setTimeout:** One-shot timer, not recurring.
- **Blocking on greeting animation:** The 2-sec timer runs independently of the animation.

## Common Pitfalls

### Pitfall 1: Timer Fires After Unmount

**What goes wrong:** User navigates away or component unmounts before 2 seconds; setTimeout callback runs on stale state.
**How to avoid:** Return cleanup function from useEffect: `return () => clearTimeout(timer)`.

### Pitfall 2: Greeting Flashes on Same-Session Return

**What goes wrong:** User refreshes page within same session; sees greeting again briefly.
**How to avoid:** Check `session.setupComplete` BEFORE rendering greeting. If true, skip directly to discovery.

## Metadata

**Confidence:** HIGH — simple component, well-understood patterns
**Research date:** 2026-03-13
**Valid until:** 2026-04-13
