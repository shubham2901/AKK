'use client'

import { useEffect, useState } from 'react'
import { useSessionStore } from '@/stores/session-store'
import { shuffleArray } from '@/stores/session-store'
import { fetchRecipes } from '@/lib/supabase/recipes'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'
import GreetingSplash from '@/components/session/GreetingSplash'
import { DiscoveryCardStack } from '@/components/discovery/DiscoveryCardStack'
import FilterBar from '@/components/discovery/FilterBar'
import RecipeDetailOverlay from '@/components/discovery/RecipeDetailOverlay'
import { AnimatePresence, motion } from 'motion/react'
import type { Recipe } from '@/lib/types/database.types'

export default function Home() {
  const hasHydrated = useSessionStore((s) => s._hasHydrated)
  const onboardingComplete = useSessionStore((s) => s.preferences.onboardingComplete)
  const setupComplete = useSessionStore((s) => s.session.setupComplete)
  const pool = useSessionStore((s) => s.session.pool)
  const preferences = useSessionStore((s) => s.preferences)
  const recordViewed = useSessionStore((s) => s.recordViewed)

  const [fetchDone, setFetchDone] = useState(pool.length > 0)
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
            <div className="relative h-screen w-full">
              <DiscoveryCardStack
                onCardTap={(recipe) => {
                  recordViewed(recipe.id)
                  setSelectedRecipe(recipe)
                }}
              />
              <FilterBar pool={pool} />
            </div>
          )}
        </motion.main>
      )}

      {selectedRecipe && (
        <RecipeDetailOverlay
          recipe={selectedRecipe}
          open={!!selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </AnimatePresence>
  )
}
