'use client'

import { useCallback, useState } from 'react'
import { motion } from 'motion/react'
import { useSessionStore } from '@/stores/session-store'
import SettingsPreferencesContent from '@/components/settings/SettingsPreferencesContent'
import { CuisineBlocklistChips } from '@/components/settings/CuisineBlocklistChips'
import type { Recipe } from '@/lib/types/database.types'
import {
  type MomentId,
  type RecipeCategoryId,
  MOMENT_LABELS,
  MOMENT_MEAL_TIMES,
  RECIPE_CATEGORY_LABELS,
  getMomentFromMealFilter,
  setMomentMealTypeFilter,
} from '@/lib/constants/recipe-filter-mappings'

const MOMENT_ICONS: Record<MomentId, string> = {
  breakfast: 'wb_sunny',
  lunch: 'partly_cloudy_day',
  dinner: 'moon_stars',
}

const RECIPE_CATEGORY_ICONS: Record<RecipeCategoryId, string> = {
  mains: 'restaurant',
  sides: 'tapas',
  beverages: 'local_bar',
  desserts: 'icecream',
}

const RECIPE_CATEGORY_ORDER: RecipeCategoryId[] = ['mains', 'sides', 'beverages', 'desserts']

interface FilterBottomSheetProps {
  open: boolean
  onClose: () => void
  /** Retained for callers; filtering uses session + DB field mappings. */
  pool: Recipe[]
  onRebuildPool?: () => void | Promise<void>
}

export default function FilterBottomSheet({
  open,
  onClose,
  pool: _pool,
  onRebuildPool,
}: FilterBottomSheetProps) {
  const [showMoreDiet, setShowMoreDiet] = useState(false)
  const cuisineFilter = useSessionStore((s) => s.session.cuisineFilter)
  const mealTypeFilter = useSessionStore((s) => s.session.mealTypeFilter)
  const recipeTypeFilter = useSessionStore((s) => s.session.recipeTypeFilter)
  const setCuisineFilter = useSessionStore((s) => s.setCuisineFilter)
  const setMealTypeFilter = useSessionStore((s) => s.setMealTypeFilter)
  const setRecipeTypeFilter = useSessionStore((s) => s.setRecipeTypeFilter)

  const selectedMoment = getMomentFromMealFilter(mealTypeFilter)

  const cuisineFilterSelectedSet = new Set(cuisineFilter)

  const toggleRecipeCategory = (value: RecipeCategoryId) => {
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

  const onMomentPress = (id: MomentId) => {
    if (selectedMoment === id) {
      setMealTypeFilter([])
      return
    }
    setMealTypeFilter(setMomentMealTypeFilter(id))
  }

  const handleClose = useCallback(() => {
    setShowMoreDiet(false)
    onClose()
  }, [onClose])

  const sectionTitleClass =
    'font-heading font-bold text-xs uppercase tracking-[0.2em] text-charcoal mb-3'

  const chipSelected =
    'bg-primary text-white border-charcoal shadow-[4px_4px_0px_0px_#1C1C1E]'
  const chipIdle = 'bg-white text-charcoal border-charcoal'

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
        onClick={handleClose}
        aria-hidden="true"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Your flavors"
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[min(85dvh,900px)] flex flex-col bg-bg-light rounded-t-[12px] border-t-2 border-x-2 border-charcoal max-w-md mx-auto w-full"
        initial={false}
        animate={{ y: open ? 0 : '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="shrink-0 flex justify-center pt-2 pb-1" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-charcoal/25" />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl uppercase tracking-[-0.04em] leading-[0.9] text-charcoal mb-8">
            Your flavors
          </h2>

          <section className="mb-8">
            <h3 className={sectionTitleClass}>Moment</h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {(Object.keys(MOMENT_MEAL_TIMES) as MomentId[]).map((id) => {
                const isSelected = selectedMoment === id
                return (
                  <motion.button
                    key={id}
                    type="button"
                    onClick={() => onMomentPress(id)}
                    whileTap={{ scale: 0.97, y: 1 }}
                    className={`flex flex-col items-center justify-between rounded-[12px] border-2 p-3 sm:p-4 min-h-[100px] transition-colors ${
                      isSelected ? chipSelected : chipIdle
                    }`}
                  >
                    <div
                      className={`flex aspect-square w-full max-w-[3.5rem] items-center justify-center rounded-full border-2 border-charcoal ${
                        isSelected ? 'bg-white/20' : 'bg-bg-light'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-3xl sm:text-4xl ${
                          isSelected ? 'text-white' : 'text-charcoal'
                        }`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {MOMENT_ICONS[id]}
                      </span>
                    </div>
                    <p
                      className={`mt-2 text-center text-[10px] sm:text-xs font-extrabold uppercase tracking-tighter leading-tight ${
                        isSelected ? 'text-white' : 'text-charcoal'
                      }`}
                    >
                      {MOMENT_LABELS[id]}
                    </p>
                  </motion.button>
                )
              })}
            </div>
          </section>

          <section className="mb-8">
            <h3 className={sectionTitleClass}>Yes to</h3>
            <CuisineBlocklistChips
              variant="filter"
              selectedSet={cuisineFilterSelectedSet}
              onToggle={toggleCuisine}
            />
          </section>

          <section className="mb-6">
            <h3 className={sectionTitleClass}>Recipe type</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {RECIPE_CATEGORY_ORDER.map((id) => {
                const isSelected = recipeTypeFilter.includes(id)
                return (
                  <motion.button
                    key={id}
                    type="button"
                    onClick={() => toggleRecipeCategory(id)}
                    whileTap={{ scale: 0.97, y: 1 }}
                    className={`flex flex-row items-center gap-3 rounded-[12px] border-2 px-3 py-3 sm:px-4 min-h-[56px] text-left ${
                      isSelected ? chipSelected : chipIdle
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-2xl shrink-0 ${
                        isSelected ? 'text-white' : 'text-charcoal'
                      }`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {RECIPE_CATEGORY_ICONS[id]}
                    </span>
                    <span
                      className={`font-heading text-sm font-bold uppercase tracking-tight ${
                        isSelected ? 'text-white' : 'text-charcoal'
                      }`}
                    >
                      {RECIPE_CATEGORY_LABELS[id]}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </section>

          <div className="border-t-2 border-charcoal/15 pt-4 mb-4">
            <button
              type="button"
              onClick={() => setShowMoreDiet((v) => !v)}
              className="w-full text-center py-3 text-sm font-bold uppercase tracking-wider text-charcoal border-2 border-charcoal rounded-[12px] bg-white shadow-[4px_4px_0px_0px_#1C1C1E] active:translate-y-px active:shadow-none min-h-[44px]"
            >
              {showMoreDiet ? 'Less' : 'More'}
            </button>
            {showMoreDiet && (
              <div className="mt-4">
                <SettingsPreferencesContent
                  onAfterPreferenceChange={onRebuildPool}
                  showCuisineBlocklist={false}
                />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}
