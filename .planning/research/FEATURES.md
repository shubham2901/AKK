# Feature Landscape

**Domain:** Recipe discovery web app (swipe-based, no-search)
**Project:** Aaj Kya Khana Hai?
**Researched:** 2026-03-13
**Confidence:** HIGH

## Executive Summary

Recipe discovery products fall into two camps: **recipe managers** (Paprika, Forkee) with search, import, meal planning, grocery lists—and **discovery engines** (SomeYum, Panly) that reduce decision fatigue by constraining choice. AKK is firmly in the latter camp. Table stakes for discovery apps are different: users expect one-at-a-time presentation, quick filters, and a path to "I found it." Differentiators are the opinionated no-search philosophy, Indian cooking focus, and YouTube-first content. Anti-features include search, meal planning, and anything that reintroduces browsing or choice paralysis.

---

## Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **One recipe at a time** | Core of swipe/discovery UX; users expect Tinder-style cards, not lists | LOW | Full-screen cards, no scrolling through grids |
| **Swipe navigation** | Standard for discovery apps; 10–15 swipes to find a match is the norm | MEDIUM | Framer Motion snap/spring; left=skip, right=like or tap for detail |
| **Diet + cuisine filters** | Users expect to narrow by vegetarian/non-veg, cuisine type | LOW | Onboarding diet + blocklist; session cuisine pick (1–3) |
| **Recipe detail view** | Must see photo, name, and how to cook before committing | LOW | Overlay/slide-up, not full-page nav; preserves card position |
| **Link to recipe source** | Users expect to reach the actual recipe (video, blog) | LOW | YouTube link + web recipe link; "Found my pick" CTA |
| **Session persistence** | Losing progress on refresh = instant churn | MEDIUM | localStorage for card position + pool order; 4hr inactivity = new session |
| **Empty state handling** | Filters yielding 0 results feels broken | LOW | Min 5 recipes in pool; reset/shuffle when empty |
| **Settings / preferences** | Users expect to change diet and blocklist | LOW | Edit diet preference, cuisine blocklist |
| **Mobile-first layout** | Urban couples use phones; must work on small screens | LOW | Neo-brutalist, touch-friendly, no hover-dependent UX |

---

## Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **No search** | Eliminates decision fatigue; users don't have to know what they want | LOW | Deliberate product choice; resist all search requests |
| **Indian cooking focus** | Hebbar's Kitchen = trusted source; niche clarity vs generic recipe apps | LOW | 3,120 recipes, South Indian breakfast/snacks/curries strength |
| **YouTube-first content** | Video recipes match how Indians learn to cook; link directly to Hebbar's | LOW | YouTube link primary; web recipe as fallback |
| **Anonymous sessions** | Zero friction; no signup wall; couples can try immediately | LOW | localStorage UUID; no auth for V0 |
| **One-line hook** | Quick "why this recipe" without reading full detail | LOW | LLM-generated; e.g. "Quick prep for a busy morning" |
| **Signal logging** | Enables future personalisation; success inference without asking | MEDIUM | Supabase; swipe_next, tap, youtube_open, found_my_pick |
| **Success inference** | YouTube open + 2hr no return = session_success_inferred | LOW | Heuristic; validates core job without survey |
| **Shuffle / re-randomize** | Escape local maxima; "nothing good in this batch" | LOW | Re-randomize session pool on demand |
| **Ingredient filter (optional)** | "I have paneer" without turning into search | LOW | Single-select, skippable; narrows pool, not browse |

---

## Anti-Features (Deliberately NOT Build)

Features that seem good but contradict the product philosophy or create scope creep.

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| **Search** | "Users want to find specific recipes" | Reintroduces decision fatigue; contradicts no-search philosophy | Swipe + filters; cuisine/ingredient narrow the pool, not search |
| **Meal planning** | Common in recipe apps | Different job (planning vs deciding tonight); scope creep | Out of scope; validate discovery first |
| **Grocery lists** | "Help users shop" | Different workflow; adds complexity | Out of scope for V0 |
| **Recipe import / clipping** | Competitors have it | AKK is discovery from curated source, not personal library | Not applicable; Hebbar's is the source |
| **User accounts / login** | "Save preferences across devices" | Adds friction; anonymous sessions validate core loop first | localStorage for V0; add auth only after PMF |
| **Partner sync / shared sessions** | "Couples decide together" | Requires auth; complex state sync | Defer; single device + "Found my pick" is sufficient for V0 |
| **Personalisation / ranking engine** | "Show better recipes" | Needs 30+ sessions per user; cold start problem | Random + filters for V0; use signal logging for V2 |
| **Calorie / nutrition data** | "Health-conscious users" | Not in source data; different product | Out of scope |
| **Push notifications** | "Bring users back" | Build after return-visit habit confirmed | Defer |
| **Native Android / iOS** | "Better mobile experience" | Post web PMF validation | PWA / mobile web first |
| **Vibe system (8 vibes)** | "Match mood" | Needs session data to validate; premature | V2 |
| **Complex filter bar** | "More control" | Slips toward browsing; analysis paralysis | Keep filters minimal: diet, blocklist, cuisine, optional ingredient |

---

## Feature Dependencies

```
[Onboarding: diet + blocklist]
    └──requires──> [Session setup: cuisine pick]
                       └──requires──> [Discovery loop: card pool]
                                          └──requires──> [Recipe detail overlay]
                                                             └──requires──> [Found my pick CTA]

[Session persistence] ──enhances──> [Discovery loop]
[Signal logging] ──enhances──> [All interactions]
[Success inference] ──depends on──> [Signal logging: youtube_open]

[Search] ──conflicts──> [No-search philosophy]
[Meal planning] ──conflicts──> [Discovery-only scope]
```

### Dependency Notes

- **Session setup requires onboarding:** Diet and blocklist define the global pool; cuisine pick narrows for this session.
- **Discovery loop requires filtered pool:** Diet + blocklist + cuisine + optional ingredient → randomized pool, min 5 recipes.
- **Recipe detail preserves card position:** Overlay, not route; user can return to discovery and continue swiping.
- **Success inference depends on youtube_open:** If user opens YouTube and doesn't return for 2hr, log session_success_inferred.
- **Search conflicts with no-search:** Any search box undermines the core value proposition.

---

## MVP Definition

### Launch With (V0)

Minimum viable product — what's needed to validate the concept.

- [x] **Onboarding:** diet preference + cuisine blocklist → localStorage
- [x] **Session setup:** cuisine pick (1–3) + optional ingredient filter
- [x] **Discovery loop:** full-screen swipe cards, one at a time
- [x] **Recipe detail:** photo, name, chips, one-line hook, YouTube link, web recipe link
- [x] **Found my pick CTA:** logs "Used", toast, button → "Picked"
- [x] **Signal logging:** all interactions to Supabase
- [x] **Session persistence:** card position + pool order survive refresh
- [x] **New session after 4hr inactivity**
- [x] **Success inference:** YouTube open + 2hr no return
- [x] **Settings:** edit diet + blocklist
- [x] **Empty state:** <5 recipes → reset/shuffle options
- [x] **Shuffle button:** re-randomize session pool

### Add After Validation (V1.x)

Features to add once core loop is working.

- [ ] **Personalisation:** use signal data for ranking (needs 30+ sessions)
- [ ] **Vibe system:** 8 vibes for mood matching (needs session data)
- [ ] **Partner sync:** shared sessions (requires auth)
- [ ] **Push notifications:** return visit habit confirmed

### Future Consideration (V2+)

Features to defer until product-market fit.

- [ ] **User accounts:** cross-device sync
- [ ] **Meal planning:** if discovery validates and users ask
- [ ] **Native apps:** post web PMF
- [ ] **Additional recipe sources:** beyond Hebbar's Kitchen

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Swipe discovery loop | HIGH | MEDIUM | P1 |
| Diet + cuisine filters | HIGH | LOW | P1 |
| Recipe detail overlay | HIGH | LOW | P1 |
| YouTube + web links | HIGH | LOW | P1 |
| Found my pick CTA | HIGH | LOW | P1 |
| Session persistence | HIGH | MEDIUM | P1 |
| Signal logging | MEDIUM | MEDIUM | P1 |
| Onboarding flow | HIGH | LOW | P1 |
| Settings page | MEDIUM | LOW | P1 |
| Empty state | MEDIUM | LOW | P1 |
| Shuffle button | MEDIUM | LOW | P1 |
| Success inference | MEDIUM | LOW | P1 |
| Ingredient filter | MEDIUM | LOW | P2 |
| Personalisation | HIGH | HIGH | P3 |
| Partner sync | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | SomeYum (Food Tinder) | Panly (Decision Engine) | Paprika / Forkee | AKK Approach |
|---------|------------------------|-------------------------|------------------|--------------|
| Discovery model | Swipe, AI learns | One suggestion, deterministic | Search + browse | Swipe, no search |
| Personalisation | AI from swipes | Scoring algorithm | Manual tags | Filters only (V0); signals for V2 |
| Recipe source | 10K+ database | Curated | User import | Hebbar's Kitchen (curated) |
| Accounts | Optional for sync | Required | Required | Anonymous (V0) |
| Couple mode | Yes, both swipe | No | No | Single device (V0) |
| Video recipes | Mixed | No | No | YouTube-first |
| Indian focus | No | No | No | Yes (differentiator) |

---

## Sources

- [SomeYum / Visieasy: What is a Food Tinder App?](https://visieasy.com/blog/food-tinder-app.html) — swipe mechanics, decision fatigue, 10–15 swipes to find
- [Panly: Opinionated Decision Engine (Medium, Jan 2026)](https://ted2xmen.medium.com/stop-scrolling-start-cooking-the-architecture-of-an-opinionated-decision-engine-136595349a0b) — no browsing, deterministic suggestions, session persistence
- [CookEase: Recipe Organizer Features 2026](https://cookeaseapp.com/resources/top-recipe-organizer-features-2026) — AI import, hands-free cooking, meal planning expectations
- [OrganizEat: Best Features in Recipe Apps](https://home.organizeat.com/blog/best-features-to-look-for-in-recipe-apps/) — search, filtering, cloud sync
- [Deglaze vs Paprika (2026)](https://www.deglaze.app/blog/deglaze-vs-paprika) — table stakes vs AI differentiators
- [Forkee: Recipe Manager Comparison](https://www.getforkee.com/blog/best-recipe-manager-apps/) — household features, AI extraction
- [MVP Scope Checklist: Feature Creep](https://www.mvpexpert.com/blog/the-ultimate-mvp-scope-checklist-how-to-prevent-feature-creep-launch-faster) — lock scope, v2 backlog
- [Hebbar's Kitchen App (AppAdvice)](https://appadvice.com/app/hebbars-kitchen/1176001249) — Indian vegetarian focus, video recipes
- PROJECT.md, PRD requirements — project-specific scope and constraints

---
*Feature research for: Recipe discovery web app (Aaj Kya Khana Hai?)*
*Researched: 2026-03-13*
