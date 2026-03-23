'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useSessionStore } from '@/stores/session-store'
import SettingsPreferencesContent from '@/components/settings/SettingsPreferencesContent'
import type { Recipe } from '@/lib/types/database.types'

interface FilterBottomSheetProps {
  open: boolean
  onClose: () => void
  pool: Recipe[]
  onRebuildPool?: () => void | Promise<void>
}

export default function FilterBottomSheet({
  open,
  onClose,
  pool,
  onRebuildPool,
}: FilterBottomSheetProps) {
  const [showMoreSettings, setShowMoreSettings] = useState(false)
  const cuisineFilter = useSessionStore((s) => s.session.cuisineFilter)
  const mealTypeFilter = useSessionStore((s) => s.session.mealTypeFilter)
  const recipeTypeFilter = useSessionStore((s) => s.session.recipeTypeFilter)
  const setCuisineFilter = useSessionStore((s) => s.setCuisineFilter)
  const setMealTypeFilter = useSessionStore((s) => s.setMealTypeFilter)
  const setRecipeTypeFilter = useSessionStore((s) => s.setRecipeTypeFilter)

  const recipeTypeOptions = [...new Set(
    pool.flatMap((r) => {
      if (!r.recipe_type) return []
      return r.recipe_type.includes(' | ')
        ? r.recipe_type.split(' | ').map((t) => t.trim())
        : [r.recipe_type.trim()]
    })
  )].sort()
  const cuisineOptions = [...new Set(pool.flatMap((r) => r.cuisine ?? []))].sort()
  const mealTypeOptions = [...new Set(pool.flatMap((r) => r.meal_time ?? []))].sort()

  const toggleRecipeType = (value: string) => {
    const next = recipeTypeFilter.includes(value)
      ? recipeTypeFilter.filter((t) => t !== value)
      : [...recipeTypeFilter, value]
    setRecipeTypeFilter(next)
  }

  const toggleCuisine = (value: string) => {
    const next = cuisineFilter.includes(value)
      ? cuisineFilter.filter((c) => c !== value)
      : [...cuisineFilter, value]
    setCuisineFilter(next)
  }

  const toggleMealType = (value: string) => {
    const next = mealTypeFilter.includes(value)
      ? mealTypeFilter.filter((m) => m !== value)
      : [...mealTypeFilter, value]
    setMealTypeFilter(next)
  }

  useEffect(() => {
    if (!open) setShowMoreSettings(false)
  }, [open])

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-charcoal/30"
        initial={false}
        animate={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Filters and settings"
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[min(85dvh,900px)] flex flex-col bg-bg-light rounded-t-2xl border-t-2 border-charcoal shadow-large"
        initial={false}
        animate={{ y: open ? 0 : '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="shrink-0 flex justify-center pt-2 pb-1" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-charcoal/25" />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <section className="mb-6">
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-charcoal mb-3">
              Recipe Type
            </h3>
            <div className="flex flex-wrap gap-2">
              {recipeTypeOptions.map((opt) => {
                const isSelected = recipeTypeFilter.includes(opt)
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleRecipeType(opt)}
                    className={`px-3 sm:px-4 py-2 border-2 rounded-lg font-semibold text-xs sm:text-sm min-h-[40px] transition-colors ${
                      isSelected
                        ? 'bg-primary/20 border-primary text-charcoal'
                        : 'border-charcoal text-charcoal bg-white hover:bg-charcoal/5'
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}
              {recipeTypeOptions.length === 0 && (
                <p className="text-sm text-charcoal/60">No recipe types in pool</p>
              )}
            </div>
          </section>

          <section className="mb-6">
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-charcoal mb-3">
              Cuisine
            </h3>
            <div className="flex flex-wrap gap-2">
              {cuisineOptions.map((opt) => {
                const isSelected = cuisineFilter.includes(opt)
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleCuisine(opt)}
                    className={`px-3 sm:px-4 py-2 border-2 rounded-lg font-semibold text-xs sm:text-sm min-h-[40px] transition-colors ${
                      isSelected
                        ? 'bg-primary/20 border-primary text-charcoal'
                        : 'border-charcoal text-charcoal bg-white hover:bg-charcoal/5'
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}
              {cuisineOptions.length === 0 && (
                <p className="text-sm text-charcoal/60">No cuisines in pool</p>
              )}
            </div>
          </section>

          <section className="mb-4">
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-charcoal mb-3">
              Meal Type
            </h3>
            <div className="flex flex-wrap gap-2">
              {mealTypeOptions.map((opt) => {
                const isSelected = mealTypeFilter.includes(opt)
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleMealType(opt)}
                    className={`px-3 sm:px-4 py-2 border-2 rounded-lg font-semibold text-xs sm:text-sm min-h-[40px] transition-colors ${
                      isSelected
                        ? 'bg-primary/20 border-primary text-charcoal'
                        : 'border-charcoal text-charcoal bg-white hover:bg-charcoal/5'
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}
              {mealTypeOptions.length === 0 && (
                <p className="text-sm text-charcoal/60">No meal types in pool</p>
              )}
            </div>
          </section>

          {showMoreSettings && (
            <div className="border-t-2 border-charcoal/20 pt-6 mb-4">
              <SettingsPreferencesContent onAfterPreferenceChange={onRebuildPool} />
            </div>
          )}

          <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 pb-1 bg-gradient-to-t from-bg-light from-85% to-transparent border-t border-charcoal/10 mt-2">
            <button
              type="button"
              onClick={() => setShowMoreSettings((v) => !v)}
              className="w-full text-center py-3 text-sm font-bold uppercase tracking-wider text-charcoal underline underline-offset-4 decoration-charcoal/40 hover:decoration-charcoal min-h-[44px]"
            >
              {showMoreSettings ? 'Hide additional settings' : 'More settings'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
