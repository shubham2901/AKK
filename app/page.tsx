'use client'

import { useEffect, useState } from 'react'
import { useSessionStore } from '@/stores/session-store'
import { shuffleArray } from '@/stores/session-store'
import { fetchRecipes } from '@/lib/supabase/recipes'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'
import GreetingSplash from '@/components/session/GreetingSplash'
import { DiscoveryCardStack } from '@/components/discovery/DiscoveryCardStack'
import FilterBar from '@/components/discovery/FilterBar'
import { AnimatePresence, motion } from 'motion/react'
import type { Recipe } from '@/lib/types/database.types'

export default function Home() {
  const hasHydrated = useSessionStore((s) => s._hasHydrated)
  const onboardingComplete = useSessionStore((s) => s.preferences.onboardingComplete)
  const setupComplete = useSessionStore((s) => s.session.setupComplete)
  const pool = useSessionStore((s) => s.session.pool)
  const preferences = useSessionStore((s) => s.preferences)

  const [fetchDone, setFetchDone] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  useEffect(() => {
    if (!setupComplete && pool.length === 0) {
      fetchRecipes(preferences.diet)
        .then((recipes) => {
          const shuffled = shuffleArray(recipes)
          useSessionStore.getState().setPool(shuffled)
        })
        .catch(() => {
          setFetchError('Sorry, something went wrong.')
        })
        .finally(() => {
          setFetchDone(true)
        })
    }
  }, [setupComplete, pool.length, preferences.diet])

  if (!hasHydrated) return null
  if (!onboardingComplete) return <OnboardingFlow />

  const handleSessionStart = () => {
    useSessionStore.getState().startSession([], null)
  }

  return (
    <AnimatePresence mode="wait">
      {!setupComplete ? (
        <GreetingSplash key="greeting" onComplete={handleSessionStart} />
      ) : (
        <motion.main
          key="discovery"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={
            pool.length >= 5 && !fetchError && fetchDone
              ? 'min-h-screen w-full relative'
              : 'min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto border-x-2 border-charcoal'
          }
        >
          {fetchError ? (
            <p className="font-sans text-charcoal/80 text-lg text-center">{fetchError}</p>
          ) : !fetchDone && pool.length === 0 ? (
            <>
              <div className="w-full max-w-sm h-48 rounded-xl bg-charcoal/10 animate-pulse mb-4" />
              <div className="w-full max-w-sm h-48 rounded-xl bg-charcoal/10 animate-pulse mb-4" />
              <div className="w-full max-w-sm h-48 rounded-xl bg-charcoal/10 animate-pulse" />
              <p className="font-sans text-charcoal/60 text-sm mt-4">Loading recipes...</p>
            </>
          ) : pool.length < 5 ? (
            <p className="font-sans text-charcoal/80 text-lg text-center">
              No recipes match your filters.
            </p>
          ) : (
            <div className="relative min-h-screen w-full">
              <DiscoveryCardStack
                onCardTap={(recipe) => setSelectedRecipe(recipe)}
              />
              <FilterBar pool={pool} />
            </div>
          )}
        </motion.main>
      )}

      {/* Recipe Detail overlay placeholder (Phase 7) */}
      <AnimatePresence>
        {selectedRecipe && (
          <motion.div
            key={selectedRecipe.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/30 p-4"
            onClick={() => setSelectedRecipe(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-[var(--radius-default)] border-2 border-charcoal bg-bg-light p-6 shadow-large max-w-sm w-full"
            >
              <h2 className="font-heading text-xl font-bold text-charcoal">
                {selectedRecipe.recipe_name_english ?? selectedRecipe.title ?? 'Recipe'}
              </h2>
              <p className="mt-2 font-sans text-sm text-charcoal/80">
                Detail coming in Phase 7
              </p>
              <button
                type="button"
                onClick={() => setSelectedRecipe(null)}
                className="mt-4 w-full rounded-lg border-2 border-charcoal bg-charcoal/10 px-4 py-2 font-semibold text-charcoal hover:bg-charcoal/20 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  )
}
