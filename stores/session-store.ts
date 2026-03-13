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
  nextCard: () => void
  prevCard: () => void
  shufflePool: () => void
  resetSession: () => void
  touchActivity: () => void

  setSessionId: (id: string) => void

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
  pool: [],
  currentIndex: 0,
  lastActiveAt: Date.now(),
  setupComplete: false,
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
  { sessionId: string; preferences: Preferences; session: Session } & SessionActions
>()(
  persist(
    (set, get) => ({
      sessionId: '',
      preferences: { ...initialPreferences },
      session: { ...initialSession },

      _hasHydrated: false,
      _setHasHydrated: (v) => set({ _hasHydrated: v }),

      setSessionId: (id) => set({ sessionId: id }),

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

      nextCard: () =>
        set((s) => {
          const next = Math.min(s.session.currentIndex + 1, s.session.pool.length - 1)
          return { session: { ...s.session, currentIndex: next, lastActiveAt: Date.now() } }
        }),

      prevCard: () =>
        set((s) => {
          const prev = Math.max(s.session.currentIndex - 1, 0)
          return { session: { ...s.session, currentIndex: prev, lastActiveAt: Date.now() } }
        }),

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
      }),
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true)
      },
    },
  ),
)
