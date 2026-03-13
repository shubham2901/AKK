# Domain Pitfalls

**Domain:** Swipe-based recipe discovery web app (mobile-first, Next.js 14, Framer Motion, Supabase, Zustand)  
**Researched:** 2025-03-13  
**Confidence:** MEDIUM (WebSearch + official docs; some findings from community reports)

## Critical Pitfalls

### Pitfall 1: Fetch-All + Client-Side Filtering

**What goes wrong:**
The app fetches all recipes from Supabase, then filters and shuffles on the client. At 100 recipes this feels fine; at 3,120 recipes it causes slow initial load, high memory use, and poor mobile performance. Supabase docs explicitly recommend server-side filtering.

**Why it happens:**
"Fetch once, filter locally" seems simpler than building dynamic queries. AI agents often generate this pattern because it avoids query composition logic. The PRD explicitly calls for client-side filtering.

**How to avoid:**
- Use Supabase `.in()`, `.contains()`, `.overlaps()` for diet_tags, cuisine_tags, meal_type at query time.
- Apply `order by random()` or a seeded random in Postgres for shuffle; fetch in batches (e.g., 50–100 per session).
- Keep client-side filtering only for runtime filters (e.g., ingredient) that can't be expressed efficiently in SQL, or accept a second round-trip for those.

**Warning signs:**
- Single `supabase.from('recipes').select('*')` with no `.eq()` / `.in()` / `.contains()`.
- Filter logic in `useEffect` or Zustand that runs after fetch.
- No `limit` on the initial query.

**Phase to address:**
Phase: Data / Supabase integration (before discovery loop).

---

### Pitfall 2: localStorage for Anonymous Sessions on Mobile

**What goes wrong:**
Diet preference, cuisine blocklist, and session UUID stored in localStorage are lost on iOS Safari after ~7 days of inactivity, or when the device is low on memory. Android can clear storage when the user switches apps. Users return to find preferences reset and "new session" behavior.

**Why it happens:**
localStorage is treated as persistent; on mobile it is not. Anonymous sessions without auth have no server-side fallback. AI-generated code defaults to localStorage for "simple" persistence.

**How to avoid:**
- Document clearly that preferences may be lost; consider a "Your preferences" summary on first load so users can re-apply quickly.
- For V0, accept the risk but add a `lastSeen` check and gentle "Preferences may have been cleared" message if `lastSeen` is stale.
- Plan for IndexedDB or server-side anonymous session (e.g., Supabase anonymous auth) if retention matters for V1.

**Warning signs:**
- No handling for `localStorage` being empty or throwing (private browsing).
- No `try/catch` around `localStorage.setItem` / `getItem`.
- Assuming session UUID is stable across browser clears.

**Phase to address:**
Phase: Session persistence / onboarding.

---

### Pitfall 3: Framer Motion + Next.js 14 App Router Hydration / SSR

**What goes wrong:**
Framer Motion uses `window` and browser APIs unavailable during SSR. Using it without `"use client"` causes hydration errors or "Detected multiple renderers concurrently rendering the same context provider." Animations may not run or components may flash.

**Why it happens:**
Next.js 14 App Router is server-first; Framer Motion is client-only. AI agents often add `motion` components without the `"use client"` directive or place them in server components.

**How to avoid:**
- Add `"use client"` at the top of any file that imports `motion` or `AnimatePresence`.
- Keep the discovery loop and swipe cards in a client-only subtree; avoid wrapping the root layout with Framer providers if not needed.
- Consider `motion/react-client` for RSC-compatible usage if documented and stable for your use case.

**Warning signs:**
- `motion.div` or `AnimatePresence` in a file without `"use client"`.
- Hydration mismatch warnings in console.
- "ReferenceError: window is not defined" during build or SSR.

**Phase to address:**
Phase: Foundation / component setup (first Framer Motion usage).

---

### Pitfall 4: Framer Motion Drag Gestures on Mobile

**What goes wrong:**
Drag feels laggy on mobile Safari; vertical scroll can accidentally trigger horizontal drag; `dragControls` may require a tap between gestures on some touch devices. Users experience "sticky" or unresponsive swipes.

**Why it happens:**
Framer Motion's drag uses its own animation engine (not Web Animations API). Touch events differ from pointer events; `touch-action` and gesture thresholds are often not set. AI-generated swipe UIs often copy desktop-first examples.

**How to avoid:**
- Apply `touch-action: none` (or `touch-action: pan-y` if vertical scroll is needed) to the draggable element.
- Use `dragElastic={0}` or low values to reduce accidental drag on vertical scroll.
- Set `dragConstraints` and a clear velocity threshold so small touches don't register as swipes.
- Test on real iOS Safari and Android Chrome, not just desktop resize.

**Warning signs:**
- No `touch-action` style on draggable cards.
- `drag="x"` without `dragConstraints` or threshold.
- Only tested in Chrome DevTools device emulation.

**Phase to address:**
Phase: Discovery loop / swipe card implementation.

---

### Pitfall 5: External YouTube Thumbnail URLs

**What goes wrong:**
Using `i.ytimg.com` or raw YouTube thumbnail URLs can trigger CORS errors when used in canvas or when Lighthouse audits run. Hotlinking is brittle—URLs can change, and some CDNs may block or rate-limit. Images may fail to load in private mode or behind strict corporate proxies.

**Why it happens:**
YouTube thumbnails are convenient and free; the predictable `img.youtube.com/vi/<id>/hqdefault.jpg` pattern is well-known. AI agents suggest external URLs without considering CORS, availability, or long-term stability.

**How to avoid:**
- Prefer `https://img.youtube.com/vi/<video_id>/hqdefault.jpg` (often more permissive than `i.ytimg.com`).
- Store thumbnail URLs in Supabase; consider a one-time migration to self-hosted or Supabase Storage if CORS/availability becomes an issue.
- Use `<img>` with `loading="lazy"` and `decoding="async"`; avoid canvas operations on cross-origin images unless CORS is configured.
- Add fallback placeholder for failed image loads.

**Warning signs:**
- No fallback when `onError` fires on images.
- Canvas `drawImage` on YouTube thumbnails without `crossOrigin`.
- No consideration for img.youtube.com vs i.ytimg.com.

**Phase to address:**
Phase: Recipe card / data display.

---

### Pitfall 6: AI-Generated Code Failure Patterns

**What goes wrong:**
AI coding agents introduce: hallucinated APIs (e.g., non-existent Supabase methods), state management bugs (Zustand selectors causing unnecessary re-renders), missing edge cases (empty pool, network failure, localStorage unavailable), and duplicated logic. Studies show AI-co-authored PRs have ~1.7x more issues; logic errors and security issues are higher.

**Why it happens:**
Agents optimize for "runnable" over "correct"; they lack full codebase context and tend to force solutions rather than ask clarifying questions. Vibe-coding increases reliance on generated code without systematic review.

**How to avoid:**
- Run tests, TypeScript, and linter on every AI-generated change before merge.
- Use narrow, well-scoped prompts with expected types and validation rules.
- Review Zustand usage: avoid destructuring entire store; use granular selectors or `useShallow`.
- Maintain a small "AI anti-patterns" checklist (e.g., no `select('*')` without filters, no localStorage without try/catch).
- Prefer libraries with strong docs and TypeScript support so agents have reliable references.

**Warning signs:**
- New code that wasn't type-checked or linted.
- Zustand store with `const { a, b, c } = useStore()`.
- Supabase calls without error handling or loading states.
- Copy-pasted logic that already exists elsewhere.

**Phase to address:**
Phase: All phases (ongoing discipline).

---

### Pitfall 7: AnimatePresence Key and Exit Animation

**What goes wrong:**
Using array index as `key` for swipe cards causes wrong exit animations—Framer Motion can't track which card left. Cards may animate in the wrong direction or not animate at all when the stack updates.

**Why it happens:**
Index-based keys are a common pattern for lists; AI agents and tutorials often use `key={index}`. When the top card is removed, indices shift and AnimatePresence loses track.

**How to avoid:**
- Use stable unique IDs (e.g., `recipe.id` or `video_id`) as keys for each card.
- Ensure the exiting card keeps its key until the exit animation completes.
- Avoid re-keying during exit; let AnimatePresence manage the lifecycle.

**Warning signs:**
- `key={index}` or `key={i}` in AnimatePresence children.
- Exit animation not firing or firing for the wrong card.
- Cards "jumping" instead of sliding out smoothly.

**Phase to address:**
Phase: Discovery loop / swipe card implementation.

---

### Pitfall 8: Swipe Threshold and Accidental Triggers

**What goes wrong:**
Users scrolling vertically or making small touches trigger swipes. Conversely, swipes that are too stiff feel unresponsive. The app feels either "too sensitive" or "broken."

**Why it happens:**
Default Framer Motion drag has no velocity/distance threshold. AI-generated swipe UIs rarely implement "commit threshold" logic—the point at which a drag becomes a definitive swipe vs. a cancel.

**How to avoid:**
- Implement a minimum drag distance (e.g., 80–100px) or velocity threshold before committing to swipe.
- Ignore mostly-vertical gestures (e.g., if `abs(dy) > abs(dx)` treat as scroll).
- Evaluate at `onDragEnd` rather than continuously during drag.
- Consider `whileTap` for subtle feedback without full drag.

**Warning signs:**
- No `onDragEnd` logic to decide "swipe" vs "snap back."
- No handling of vertical vs horizontal gesture direction.
- Tiny movements causing card dismissal.

**Phase to address:**
Phase: Discovery loop / swipe card implementation.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|------------------|
| Fetch all recipes, filter client-side | Simpler query logic | Slow load at 1K+ recipes, high memory | V0 with ≤100 recipes only; document migration path |
| localStorage for preferences | No backend, no auth | Data loss on mobile, private browsing | V0; add fallback messaging |
| External YouTube thumbnails | Free, no storage | CORS, availability, hotlink risk | V0; plan migration if issues arise |
| No error boundaries | Faster ship | White screen on uncaught errors | Never; add at least app-level boundary |
| Index as AnimatePresence key | Quick to write | Broken exit animations | Never |
| Zustand destructuring whole store | Less boilerplate | Unnecessary re-renders | Never; use selectors |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase | `select('*')` with no filters | Use `.in()`, `.contains()`, `.overlaps()` for arrays; add `limit` |
| Supabase | Ignoring RLS | RLS policies apply to all queries; test with anonymous role |
| Framer Motion | Using in server components | `"use client"` on any file importing motion |
| Framer Motion | No touch-action on drag | `touch-action: none` (or pan-y) on draggable element |
| Zustand | `const { a, b } = useStore()` | `useStore(s => s.a)`, `useStore(s => s.b)` or `useShallow` |
| localStorage | No try/catch | Wrap in try/catch; handle quota exceeded, private mode |
| YouTube thumbnails | Direct i.ytimg.com | Prefer img.youtube.com; add onError fallback |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|-----|----------|------------|----------------|
| Fetch all recipes | Slow first load, high memory | Server-side filter + pagination/batching | ~500+ recipes |
| Heavy pointer handlers | Jank during drag on mid-range phones | Throttle/debounce; avoid layout thrash in handlers | Low-end mobile |
| Unoptimized images | Layout shift, slow LCP | `loading="lazy"`, dimensions, placeholder | Many cards in view |
| Zustand broad selectors | Re-renders on unrelated updates | Granular selectors, `useShallow` | As store grows |
| No lazy load for cards | All cards in DOM | Virtualize or render only visible + next 1–2 | 50+ cards in session |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Public INSERT on user_interactions | Spam, fake analytics | Rate limit via Supabase Edge Function or RLS; consider session validation |
| Session ID in localStorage only | Session spoofing (low impact for anonymous) | Accept for V0; document for future auth |
| No input validation on filters | Injection if filters hit raw SQL | Use parameterized Supabase queries; never concatenate user input |
| Exposing full recipe JSON to client | Data scraping, payload size | Select only needed columns; avoid `*` if not required |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No empty state when filter returns &lt;5 | User stuck, no path forward | Empty state with "Reset filters" / "Shuffle again" |
| Cluttered filter UI | Cognitive overload, thumb reach | Bottom sheets, chips, collapsible sections |
| No loading state for cards | Feels broken during fetch | Skeleton or shimmer for card area |
| Swipe with no feedback | Unclear if action registered | Haptic (if available), visual feedback, clear threshold |
| Recipe detail as full-page nav | Loses place in stack | Overlay / bottom sheet per PRD |
| &lt;48px touch targets | Hard to tap on mobile | 48px+ for primary actions |

---

## "Looks Done But Isn't" Checklist

- [ ] **Swipe cards:** Test on real iOS Safari and Android Chrome — verify touch-action and threshold
- [ ] **Recipe fetch:** Confirm Supabase query has filters (diet, cuisine, etc.) — not raw select
- [ ] **Session persistence:** Test localStorage clear + private browsing — verify graceful degradation
- [ ] **AnimatePresence:** Use `key={recipe.id}` not `key={index}` — verify exit animation direction
- [ ] **Images:** Add `onError` fallback for YouTube thumbnails — verify no broken images
- [ ] **Empty state:** Filter to 0 recipes — verify empty state shows with reset option
- [ ] **Zustand:** Check for destructured store usage — verify no unnecessary re-renders
- [ ] **Error boundary:** Throw in a child component — verify app doesn't white-screen

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Fetch-all at scale | MEDIUM | Add server-side filters; migrate to batched/random query; may need schema indexes |
| localStorage data loss | LOW | User re-applies preferences; add "preferences cleared" messaging |
| Framer Motion hydration | LOW | Add `"use client"`; isolate motion components |
| Drag lag on mobile | MEDIUM | Add touch-action; tune thresholds; consider alternative (e.g., Motion One) if unfixable |
| YouTube thumbnail CORS | MEDIUM | Migrate to img.youtube.com; or proxy/self-host via Supabase Storage |
| AnimatePresence wrong key | LOW | Replace index with stable ID; verify exit animations |
| AI-introduced bugs | LOW–HIGH | Review, test, lint; refactor duplicated or incorrect logic |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Fetch-all + client-side filtering | Data / Supabase integration | Query uses `.in()`/`.contains()`; no unbounded `select('*')` |
| localStorage mobile loss | Session persistence / onboarding | Try/catch; fallback messaging; test on iOS |
| Framer Motion hydration | Foundation / component setup | No hydration errors; `"use client"` on motion files |
| Framer Motion drag on mobile | Discovery loop | Real-device test; touch-action set; threshold tuned |
| YouTube thumbnails | Recipe card / data display | Fallback on error; img.youtube.com preferred |
| AI-generated code failures | All phases | Lint, typecheck, tests; anti-pattern checklist |
| AnimatePresence key | Discovery loop | `key={recipe.id}`; exit animates correctly |
| Swipe threshold | Discovery loop | Vertical scroll works; small touches don't swipe |

---

## Sources

- [Supabase Query Optimization](https://supabase.com/docs/guides/database/query-optimization)
- [Supabase RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Framer Motion + Next.js 14 use client](https://medium.com/@dolce-emmy/resolving-framer-motion-compatibility-in-next-js-14-the-use-client-workaround-1ec82e5a0a75)
- [Framer Motion drag mobile issues (GitHub #1673, #712, #1582)](https://github.com/framer/motion/issues)
- [Motion useDragControls touch-action](https://motion.dev/docs/react-use-drag-controls)
- [localStorage on mobile (Stack Overflow)](https://stackoverflow.com/questions/66838054/local-storage-how-does-it-behave-on-mobile-devices)
- [YouTube thumbnail CORS (lite-youtube-embed #59)](https://github.com/paulirish/lite-youtube-embed/issues/59)
- [Zustand incorrect usage (DEV)](https://dev.to/kazoottt/share-my-incorrect-usage-case-of-zustand-55gn)
- [Zustand performance pitfalls (Medium)](https://philipp-raab.medium.com/zustand-state-management-a-performance-booster-with-some-pitfalls-071c4cbee17a)
- [Swipe gesture thresholds (TheLinuxCode)](https://thelinuxcode.com/simple-swipe-with-vanilla-javascript-a-practical-production-ready-guide/)
- [Recipe UX best practices (SideChef, Recipe Kit)](https://www.sidechef.com/business/recipe-platform/ux-best-practices-for-recipe-sites)
- [AI-generated code failure patterns (Augment, DAPLab, Lint Against the Machine)](https://www.augmentcode.com/guides/debugging-ai-generated-code-8-failure-patterns-and-fixes)

---
*Pitfalls research for: Aaj Kya Khana Hai? — swipe-based recipe discovery web app*  
*Researched: 2025-03-13*
