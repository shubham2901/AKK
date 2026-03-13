'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Recipe, DietPreference, Preferences, Session } from '@/lib/types/database.types'

// ─── Safe localStorage adapter (Safari private browsing throws QuotaExceededError) ───

const safeStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value)
    } catch {
      // Safari private browsing or quota exceeded — fail silently
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name)
    } catch {
      // no-op
    }
  },
}

// ─── Store Actions ───

interface SessionActions {
  setDiet: (diet: DietPreference | null) => void
  setBlocklist: (blocklist: string[]) => void
  completeOnboarding: () => void

  startSession: (cuisines: string[], ingredientFilter: string | null) => void
  setPool: (recipes: Recipe[]) => void
  setCurrentIndex: (index: number) => void
  nextCard: (effectiveLen?: number) => void
  prevCard: (effectiveLen?: number) => void
  setCuisineFilter: (f: string[]) => void
  setMealTypeFilter: (f: string[]) => void
  shufflePool: () => void
  resetSession: () => void
  touchActivity: () => void

  setSessionId: (id: string) => void
  rotateSession: () => string
  togglePick: (recipeId: string) => void
  recordViewed: (recipeId: string) => void

  _hasHydrated: boolean
  _setHasHydrated: (v: boolean) => void
}

// ─── Initial State ───

const initialPreferences: Preferences = {
  diet: null,
  blocklist: [],
  onboardingComplete: false,
}

const initialSession: Session = {
  cuisines: [],
  ingredientFilter: null,
  cuisineFilter: [],
  mealTypeFilter: [],
  pool: [],
  currentIndex: 0,
  lastActiveAt: Date.now(),
  setupComplete: false,
}

// ─── Filter Pool (client-side cuisine + meal type) ───

export function filterPool(
  pool: Recipe[],
  cuisineFilter: string[] = [],
  mealTypeFilter: string[] = [],
): Recipe[] {
  return pool.filter((r) => {
    const matchCuisine =
      cuisineFilter.length === 0 ||
      r.cuisine_tags?.some((c) => cuisineFilter.includes(c)) === true
    const matchMeal =
      mealTypeFilter.length === 0 ||
      r.meal_type?.some((m) => mealTypeFilter.includes(m)) === true
    return matchCuisine && matchMeal
  })
}

// ─── Fisher-Yates Shuffle ───

export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// ─── Store ───

export const useSessionStore = create<
  {
    sessionId: string
    preferences: Preferences
    session: Session
    pickedIds: string[]
    viewedIds: string[]
  } & SessionActions
>()(
  persist(
    (set, get) => ({
      sessionId: '',
      preferences: { ...initialPreferences },
      session: { ...initialSession },
      pickedIds: [],
      viewedIds: [],

      _hasHydrated: false,
      _setHasHydrated: (v) => set({ _hasHydrated: v }),

      setSessionId: (id) => set({ sessionId: id }),

      rotateSession: () => {
        const newId = crypto.randomUUID()
        set((s) => ({
          sessionId: newId,
          session: {
            ...s.session,
            pool: shuffleArray(s.session.pool),
            currentIndex: 0,
            lastActiveAt: Date.now(),
          },
          viewedIds: [],
        }))
        return newId
      },

      togglePick: (recipeId) =>
        set((s) => ({
          pickedIds: s.pickedIds.includes(recipeId)
            ? s.pickedIds.filter((id) => id !== recipeId)
            : [...s.pickedIds, recipeId],
        })),

      recordViewed: (recipeId) =>
        set((s) => ({
          viewedIds: s.viewedIds.includes(recipeId)
            ? s.viewedIds
            : [...s.viewedIds, recipeId],
        })),

      setDiet: (diet) =>
        set((s) => ({
          preferences: { ...s.preferences, diet },
        })),

      setBlocklist: (blocklist) =>
        set((s) => ({
          preferences: { ...s.preferences, blocklist },
        })),

      completeOnboarding: () =>
        set((s) => ({
          preferences: { ...s.preferences, onboardingComplete: true },
        })),

      startSession: (cuisines, ingredientFilter) =>
        set((s) => ({
          session: {
            cuisines,
            ingredientFilter,
            cuisineFilter: [],
            mealTypeFilter: [],
            pool: s.session.pool,
            currentIndex: 0,
            lastActiveAt: Date.now(),
            setupComplete: true,
          },
        })),

      setPool: (recipes) =>
        set((s) => ({
          session: { ...s.session, pool: recipes, currentIndex: 0 },
        })),

      setCurrentIndex: (index) =>
        set((s) => ({
          session: { ...s.session, currentIndex: index },
        })),

      nextCard: (effectiveLen) =>
        set((s) => {
          const len = effectiveLen ?? s.session.pool.length
          if (len === 0) return { session: { ...s.session, lastActiveAt: Date.now() } }
          const next = (s.session.currentIndex + 1) % len
          return { session: { ...s.session, currentIndex: next, lastActiveAt: Date.now() } }
        }),

      prevCard: (effectiveLen) =>
        set((s) => {
          const len = effectiveLen ?? s.session.pool.length
          if (len === 0) return { session: { ...s.session, lastActiveAt: Date.now() } }
          const prev = (s.session.currentIndex + len - 1) % len
          return { session: { ...s.session, currentIndex: prev, lastActiveAt: Date.now() } }
        }),

      setCuisineFilter: (f) =>
        set((s) => ({
          session: { ...s.session, cuisineFilter: f, currentIndex: 0, lastActiveAt: Date.now() },
        })),

      setMealTypeFilter: (f) =>
        set((s) => ({
          session: { ...s.session, mealTypeFilter: f, currentIndex: 0, lastActiveAt: Date.now() },
        })),

      shufflePool: () =>
        set((s) => ({
          session: {
            ...s.session,
            pool: shuffleArray(s.session.pool),
            currentIndex: 0,
            lastActiveAt: Date.now(),
          },
        })),

      resetSession: () =>
        set({
          session: { ...initialSession, lastActiveAt: Date.now() },
          viewedIds: [],
        }),

      touchActivity: () =>
        set((s) => ({
          session: { ...s.session, lastActiveAt: Date.now() },
        })),
    }),
    {
      name: 'akk-session',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        sessionId: state.sessionId,
        preferences: state.preferences,
        session: state.session,
        pickedIds: state.pickedIds,
      }),
      merge: (persisted, current) => {
        const p = persisted as typeof current | undefined
        if (!p) return current
        return {
          ...current,
          sessionId: p.sessionId ?? current.sessionId,
          preferences: { ...current.preferences, ...p.preferences },
          session: { ...current.session, ...p.session },
          pickedIds: p.pickedIds ?? current.pickedIds,
        }
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._setHasHydrated(true)
          if (state.sessionId.length < 8) {
            const newId = crypto.randomUUID()
            state.setSessionId(newId)
            // Sync will happen when useSessionLifecycle mounts (Plan 08-02)
          }
        }
      },
    },
  ),
)
