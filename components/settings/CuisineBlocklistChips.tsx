'use client'

import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { BLOCKLIST_CHIP_ROTATIONS, CUISINES, DEFAULT_VISIBLE_CUISINES } from '@/lib/constants/cuisines'

const DEFAULT_CUISINE_SET = new Set<string>(DEFAULT_VISIBLE_CUISINES)

type CuisineBlocklistChipsProps = {
  /** Cuisines shown as filled (primary): blocklist = hidden; filter = included. */
  selectedSet: Set<string>
  onToggle: (cuisine: string) => void
  /** Settings/filter: compact row; onboarding: larger asymmetric chips. */
  variant?: 'settings' | 'onboarding' | 'filter'
}

export function CuisineBlocklistChips({
  selectedSet,
  onToggle,
  variant = 'settings',
}: CuisineBlocklistChipsProps) {
  const [showMore, setShowMore] = useState(false)

  const { defaultList, restSorted } = useMemo(() => {
    const rest = CUISINES.filter((c) => !DEFAULT_CUISINE_SET.has(c)).sort((a, b) =>
      a.localeCompare(b),
    )
    return { defaultList: [...DEFAULT_VISIBLE_CUISINES], restSorted: rest }
  }, [])

  const visibleCuisines = showMore ? [...defaultList, ...restSorted] : defaultList

  const chipClass =
    variant === 'onboarding'
      ? 'inline-block px-5 py-2.5 border-2 border-charcoal rounded-lg font-bold text-base min-h-[44px] flex items-center'
      : 'inline-flex min-h-[44px] items-center rounded-lg border-2 border-charcoal px-4 py-2 text-sm sm:text-base font-bold'

  const rowClass =
    variant === 'onboarding'
      ? 'flex flex-wrap gap-3 items-start content-start'
      : variant === 'filter'
        ? 'flex flex-wrap gap-2 sm:gap-3'
        : 'flex flex-wrap gap-2 sm:gap-3 sm:mt-6 mt-4'

  return (
    <div>
      <div className={rowClass}>
        {visibleCuisines.map((cuisine, index) => {
          const isSelected = selectedSet.has(cuisine)
          const rotationClass =
            BLOCKLIST_CHIP_ROTATIONS[index % BLOCKLIST_CHIP_ROTATIONS.length]
          return (
            <motion.button
              key={cuisine}
              type="button"
              onClick={() => onToggle(cuisine)}
              whileTap={{ scale: 0.95 }}
              className={`${chipClass} ${rotationClass} ${
                isSelected
                  ? 'bg-primary text-white shadow-[4px_4px_0px_0px_#1C1C1E]'
                  : 'bg-white text-charcoal'
              }`}
            >
              {cuisine}
            </motion.button>
          )
        })}
      </div>
      {variant !== 'filter' && restSorted.length > 0 && (
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="mt-4 text-sm font-bold text-charcoal underline decoration-2 underline-offset-4 hover:text-primary"
        >
          {showMore ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}
