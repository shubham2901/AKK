'use client'

import { useState } from 'react'
import { useSessionStore } from '@/stores/session-store'
import { logInteraction } from '@/services/interaction-logger'
import FilterBottomSheet from './FilterBottomSheet'
import type { Recipe } from '@/lib/types/database.types'

interface FilterBarProps {
  pool: Recipe[]
  onOpenSettings?: () => void
}

export default function FilterBar({ pool, onOpenSettings }: FilterBarProps) {
  const [filterOpen, setFilterOpen] = useState(false)
  const sessionId = useSessionStore((s) => s.sessionId)
  const shufflePool = useSessionStore((s) => s.shufflePool)
  const cuisineFilter = useSessionStore((s) => s.session.cuisineFilter)
  const mealTypeFilter = useSessionStore((s) => s.session.mealTypeFilter)

  const hasActiveFilters = cuisineFilter.length > 0 || mealTypeFilter.length > 0
  const activeChips = [...cuisineFilter, ...mealTypeFilter]

  return (
    <>
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-6 flex flex-col gap-3 pointer-events-none">
        <div className="flex justify-between gap-2 pointer-events-auto">
          <div className="flex gap-2">
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border-2 border-charcoal bg-charcoal/10 text-charcoal hover:bg-charcoal/20 transition-colors"
                aria-label="Open settings"
              >
                <span className="material-symbols-outlined text-xl">settings</span>
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-charcoal bg-charcoal/10 text-charcoal hover:bg-charcoal/20 transition-colors"
              aria-label="Open filters"
            >
              <span className="material-symbols-outlined text-xl">tune</span>
            </button>
            <button
              type="button"
              onClick={() => {
                logInteraction(sessionId, 'shuffle')
                shufflePool()
              }}
              className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-charcoal bg-charcoal/10 text-charcoal hover:bg-charcoal/20 transition-colors"
              aria-label="Shuffle recipes"
            >
              <span className="material-symbols-outlined text-xl">shuffle</span>
            </button>
          </div>
        </div>
        {hasActiveFilters && activeChips.length > 0 && (
          <div className="flex flex-wrap gap-2 pointer-events-auto">
            {activeChips.map((chip) => (
              <span
                key={chip}
                className="rounded-[var(--radius-default)] border-2 border-charcoal bg-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-charcoal"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>
      <FilterBottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} pool={pool} />
    </>
  )
}
