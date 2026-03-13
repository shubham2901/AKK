# Phase 2: Data Layer — Context

## Decisions (Locked)

### Supabase Project
- **Project:** AKK (project ID: `hrmhnovohubkfyxipjog`)
- **URL:** `https://hrmhnovohubkfyxipjog.supabase.co`
- **Region:** ap-northeast-1
- **Schema applied:** Migration `create_akk_schema` applied with all 3 tables, GIN indexes, RLS policies, and abuse protection constraints
- **Credentials:** `.env.local` already configured with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Persistence Strategy (V0)
- Persist **full Recipe objects** in localStorage for V0 (100 recipes × ~2KB = ~200KB, well within 5MB limit)
- Avoids re-fetch-on-hydration complexity
- Switch to IDs-only when scaling to 3,120 recipes

### Store Architecture
- **Single Zustand store** with logical groupings (not multiple stores)
- Shape: `sessionId`, `preferences` (diet, blocklist, onboardingComplete), `session` (cuisines, ingredientFilter, pool, currentIndex, lastActiveAt, setupComplete)
- `persist` middleware with `partialize` to exclude actions
- Custom `storage` adapter with `try/catch` for localStorage safety (mobile Safari, private browsing)

### Interaction Logger
- **Include in Phase 2** (not deferred to Phase 7)
- ~15 lines, pure infrastructure, fire-and-forget `supabase.from('user_interactions').insert()`
- Ready for consumers when discovery loop and recipe detail are built

## Claude's Discretion

- Exact Zustand action names and signatures
- Whether to use `useShallow` or individual selectors (follow Zustand best practices)
- File organization within `lib/`, `stores/`, `services/`
- Whether to generate types manually or use Supabase auto-generated types as base

## Deferred Ideas

- IndexedDB fallback for localStorage (V1 if retention matters)
- Server-side anonymous auth via Supabase (V1)
- "Preferences may have been cleared" messaging (Phase 8 or 9)
