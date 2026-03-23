'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSessionStore, filterPool, shuffleArray } from '@/stores/session-store'
import { fetchRecipes } from '@/lib/supabase/recipes'
import { filterRecipesByBlocklist } from '@/lib/utils/recipe-filters'
import { syncSession } from '@/services/session-sync'
import { useSessionLifecycle } from '@/hooks/useSessionLifecycle'
import { logInteraction } from '@/services/interaction-logger'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'
import GreetingSplash from '@/components/session/GreetingSplash'
import { DiscoveryCardStack } from '@/components/discovery/DiscoveryCardStack'
import FilterBar from '@/components/discovery/FilterBar'
import EmptyDiscoveryState from '@/components/discovery/EmptyDiscoveryState'
import SettingsScreen from '@/components/settings/SettingsScreen'
import RecipeDetailOverlay from '@/components/discovery/RecipeDetailOverlay'
import { AnimatePresence, motion } from 'motion/react'
import type { Recipe } from '@/lib/types/database.types'

export default function Home() {
  const hasHydrated = useSessionStore((s) => s._hasHydrated)
  const sessionId = useSessionStore((s) => s.sessionId)
  const preferences = useSessionStore((s) => s.preferences)
  const onboardingComplete = useSessionStore((s) => s.preferences.onboardingComplete)
  const setupComplete = useSessionStore((s) => s.session.setupComplete)
  const pool = useSessionStore((s) => s.session.pool)
  const cuisineFilter = useSessionStore((s) => s.session.cuisineFilter)
  const mealTypeFilter = useSessionStore((s) => s.session.mealTypeFilter)
  const recipeTypeFilter = useSessionStore((s) => s.session.recipeTypeFilter)
  const recordViewed = useSessionStore((s) => s.recordViewed)

  useSessionLifecycle()

  const [screen, setScreen] = useState<'discovery' | 'settings'>('discovery')
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [synced, setSynced] = useState(false)
  const [fetchDone, setFetchDone] = useState(pool.length > 0)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  const filteredPool = useMemo(
    () => filterPool(pool, cuisineFilter, mealTypeFilter, recipeTypeFilter),
    [pool, cuisineFilter, mealTypeFilter, recipeTypeFilter],
  )
  const effectiveCount = filteredPool.length

  const rebuildPoolFromPreferences = useCallback(async () => {
    const store = useSessionStore.getState()
    const { preferences: pref, sessionId: sid, session } = store
    try {
      const raw = await fetchRecipes(pref.diet)
      const filtered = filterRecipesByBlocklist(raw, pref.blocklist)
      store.setPool(shuffleArray(filtered))
      syncSession(
        sid,
        pref.diet,
        pref.blocklist,
        session.cuisineFilter,
        session.mealTypeFilter,
        session.ingredientFilter,
      )
    } catch (e) {
      console.error('[rebuildPool]', e)
    }
  }, [])

  useEffect(() => {
    if (hasHydrated && sessionId.length >= 8 && !synced) {
      syncSession(sessionId, preferences.diet, preferences.blocklist, [], [], null)
      setSynced(true)
    }
  }, [hasHydrated, sessionId, synced, preferences.diet, preferences.blocklist])

  useEffect(() => {
    if (!setupComplete && pool.length === 0) {
      fetchRecipes(preferences.diet)
        .then((recipes) => {
          const filtered = filterRecipesByBlocklist(recipes, preferences.blocklist)
          useSessionStore.getState().setPool(shuffleArray(filtered))
        })
        .catch(() => {
          setFetchError('Sorry, something went wrong.')
        })
        .finally(() => {
          setFetchDone(true)
        })
    }
  }, [setupComplete, pool.length, preferences.diet, preferences.blocklist])

  if (!hasHydrated) return null
  if (!onboardingComplete) return <OnboardingFlow />

  const handleSessionStart = () => {
    useSessionStore.getState().startSession([], null)
  }

  const handleResetFilters = () => {
    useSessionStore.getState().clearSessionFilters()
  }

  const handleShuffleEmpty = () => {
    logInteraction(sessionId, 'shuffle')
    useSessionStore.getState().shufflePool()
  }

  const openSettings = () => setScreen('settings')

  const showDiscoveryShell =
    fetchDone && !fetchError && pool.length > 0 && (effectiveCount >= 5 || effectiveCount < 5)

  return (
    <AnimatePresence mode="wait">
      {!setupComplete ? (
        <GreetingSplash key="greeting" onComplete={handleSessionStart} />
      ) : screen === 'settings' ? (
        <motion.div
          key="settings"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen w-full"
        >
          <SettingsScreen
            onBack={() => {
              setScreen('discovery')
              void rebuildPoolFromPreferences()
            }}
          />
        </motion.div>
      ) : (
        <motion.main
          key="discovery"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={
            showDiscoveryShell
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
          ) : fetchDone && pool.length === 0 && !fetchError ? (
            <div className="flex flex-col items-center gap-6 text-center">
              <p className="font-sans text-charcoal/80 text-lg">
                No recipes match your preferences right now.
              </p>
              <button
                type="button"
                onClick={openSettings}
                className="rounded-xl border-2 border-charcoal bg-primary px-6 py-3 font-heading font-black uppercase tracking-widest text-white"
              >
                Open settings
              </button>
            </div>
          ) : effectiveCount >= 5 ? (
            <div className="relative flex h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full max-w-[100vw] flex-col overflow-hidden">
              <DiscoveryCardStack
                keyboardDisabled={filterSheetOpen || !!selectedRecipe}
                onCardTap={(recipe) => {
                  recordViewed(recipe.id)
                  setSelectedRecipe(recipe)
                }}
              />
              <FilterBar
                pool={pool}
                onRebuildPool={rebuildPoolFromPreferences}
                onFilterOpenChange={setFilterSheetOpen}
              />
            </div>
          ) : (
            <div className="relative flex min-h-[100dvh] w-full max-w-[100vw] flex-col">
              <EmptyDiscoveryState
                onResetFilters={handleResetFilters}
                onShuffleAnyway={handleShuffleEmpty}
              />
              <FilterBar
                pool={pool}
                onRebuildPool={rebuildPoolFromPreferences}
                onFilterOpenChange={setFilterSheetOpen}
              />
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
