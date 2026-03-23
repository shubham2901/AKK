'use client'

import { motion } from 'motion/react'
import { useSessionStore } from '@/stores/session-store'
import type { Recipe } from '@/lib/types/database.types'

interface FilterBottomSheetProps {
  open: boolean
  onClose: () => void
  pool: Recipe[]
}

export default function FilterBottomSheet({ open, onClose, pool }: FilterBottomSheetProps) {
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

  return (
    <>
      {/* Backdrop */}
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

      {/* Bottom sheet */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-bg-light rounded-t-2xl border-t-2 border-charcoal shadow-large"
        initial={false}
        animate={{ y: open ? 0 : '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="p-6 pb-safe max-h-[70vh] overflow-y-auto">
          {/* Recipe type section */}
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
                    className={`px-4 py-2 border-2 rounded-lg font-semibold text-sm min-h-[40px] transition-colors ${
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

          {/* Cuisine section */}
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
                    className={`px-4 py-2 border-2 rounded-lg font-semibold text-sm min-h-[40px] transition-colors ${
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

          {/* Meal type section */}
          <section>
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
                    className={`px-4 py-2 border-2 rounded-lg font-semibold text-sm min-h-[40px] transition-colors ${
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
        </div>
      </motion.div>
    </>
  )
}
