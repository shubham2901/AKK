'use client'

import { useState } from 'react'
import { useSessionStore } from '@/stores/session-store'
import { logInteraction } from '@/services/interaction-logger'
import FilterBottomSheet from './FilterBottomSheet'
import type { Recipe } from '@/lib/types/database.types'

interface FilterBarProps {
  pool: Recipe[]
  onRebuildPool?: () => void | Promise<void>
  onFilterOpenChange?: (open: boolean) => void
}

export default function FilterBar({ pool, onRebuildPool, onFilterOpenChange }: FilterBarProps) {
  const [filterOpen, setFilterOpen] = useState(false)
  const sessionId = useSessionStore((s) => s.sessionId)
  const shufflePool = useSessionStore((s) => s.shufflePool)
  const cuisineFilter = useSessionStore((s) => s.session.cuisineFilter)
  const mealTypeFilter = useSessionStore((s) => s.session.mealTypeFilter)
  const recipeTypeFilter = useSessionStore((s) => s.session.recipeTypeFilter)

  const hasActiveFilters = cuisineFilter.length > 0 || mealTypeFilter.length > 0 || recipeTypeFilter.length > 0
  const activeChips = [...recipeTypeFilter, ...cuisineFilter, ...mealTypeFilter]

  const openFilters = () => {
    setFilterOpen(true)
    onFilterOpenChange?.(true)
  }

  const closeFilters = () => {
    setFilterOpen(false)
    onFilterOpenChange?.(false)
  }

  return (
    <>
      <div className="absolute top-0 left-0 right-0 z-20 p-3 sm:p-4 pt-[max(1rem,env(safe-area-inset-top))] flex flex-col gap-2 sm:gap-3 pointer-events-none">
        <div className="flex justify-end gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={openFilters}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border-2 border-charcoal bg-bg-light/88 text-charcoal shadow-small backdrop-blur-sm transition-colors hover:bg-bg-light"
            aria-label="Open filters"
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 550, 'GRAD' 0, 'opsz' 24" }}
            >
              tune
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              logInteraction(sessionId, 'shuffle')
              shufflePool()
            }}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border-2 border-charcoal bg-bg-light/88 text-charcoal shadow-small backdrop-blur-sm transition-colors hover:bg-bg-light"
            aria-label="Shuffle recipes"
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 550, 'GRAD' 0, 'opsz' 24" }}
            >
              shuffle
            </span>
          </button>
        </div>
        {hasActiveFilters && activeChips.length > 0 && (
          <div className="flex flex-wrap gap-2 pointer-events-auto max-w-[100vw] pr-1">
            {activeChips.map((chip) => (
              <span
                key={chip}
                className="rounded-[var(--radius-default)] border-2 border-charcoal bg-primary/20 px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-charcoal max-w-full truncate"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>
      <FilterBottomSheet
        open={filterOpen}
        onClose={closeFilters}
        pool={pool}
        onRebuildPool={onRebuildPool}
      />
    </>
  )
}
