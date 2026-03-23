'use client'

import { useCallback, useMemo } from 'react'
import { motion } from 'motion/react'
import { useSessionStore } from '@/stores/session-store'
import { DIET_OPTIONS } from '@/lib/constants/diets'
import { BLOCKLIST_CHIP_ROTATIONS, CUISINES } from '@/lib/constants/cuisines'

export interface SettingsPreferencesContentProps {
  /** Called after diet or blocklist changes (e.g. refetch recipe pool). */
  onAfterPreferenceChange?: () => void | Promise<void>
  className?: string
}

export default function SettingsPreferencesContent({
  onAfterPreferenceChange,
  className = '',
}: SettingsPreferencesContentProps) {
  const diet = useSessionStore((s) => s.preferences.diet)
  const blocklist = useSessionStore((s) => s.preferences.blocklist)
  const setDiet = useSessionStore((s) => s.setDiet)
  const setBlocklist = useSessionStore((s) => s.setBlocklist)

  const blockedSet = useMemo(() => new Set(blocklist), [blocklist])

  const runAfter = useCallback(async () => {
    await onAfterPreferenceChange?.()
  }, [onAfterPreferenceChange])

  const toggleCuisine = useCallback(
    async (cuisine: string) => {
      const prev = useSessionStore.getState().preferences.blocklist
      const next = new Set(prev)
      if (next.has(cuisine)) next.delete(cuisine)
      else next.add(cuisine)
      setBlocklist([...next])
      await runAfter()
    },
    [setBlocklist, runAfter],
  )

  const handleDiet = useCallback(
    async (value: (typeof DIET_OPTIONS)[number]['value']) => {
      setDiet(value)
      await runAfter()
    },
    [setDiet, runAfter],
  )

  return (
    <div className={className}>
      <section className="mt-2">
        <h2 className="font-heading text-lg font-black uppercase tracking-tight text-charcoal sm:text-xl">
          Diet
        </h2>
        <p className="mt-2 font-sans text-sm font-medium text-charcoal/70">
          Recipes shown match this preference.
        </p>
        <div className="mt-4 flex gap-2 sm:gap-3">
          {DIET_OPTIONS.map((option) => {
            const isSelected = diet === option.value
            return (
              <motion.div
                key={option.value}
                role="button"
                tabIndex={0}
                onClick={() => void handleDiet(option.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    void handleDiet(option.value)
                  }
                }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-1 flex-col items-center justify-between rounded-xl border-2 border-charcoal p-3 sm:p-4 cursor-pointer select-none min-w-0 ${
                  isSelected ? 'bg-primary shadow-medium' : 'bg-white'
                }`}
              >
                <div
                  className="flex aspect-square w-full max-w-[5rem] items-center justify-center gap-1 rounded-full border-2 border-charcoal mx-auto"
                  style={{ backgroundColor: option.iconBg }}
                >
                  <span
                    className="material-symbols-outlined text-3xl sm:text-4xl text-charcoal"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {option.icon}
                  </span>
                  {option.secondaryIcon && (
                    <span
                      className="material-symbols-outlined text-xl sm:text-2xl text-charcoal"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {option.secondaryIcon}
                    </span>
                  )}
                </div>
                <p
                  className={`mt-2 text-center text-[10px] sm:text-xs font-extrabold uppercase tracking-tighter leading-tight ${
                    isSelected ? 'text-white' : 'text-charcoal'
                  }`}
                >
                  {option.label}
                </p>
              </motion.div>
            )
          })}
        </div>
      </section>

      <section className="mt-8 sm:mt-10">
        <h2 className="font-heading text-lg font-black uppercase tracking-tight text-charcoal sm:text-xl">
          Cuisine blocklist
        </h2>
        <p className="mt-2 font-sans text-sm font-medium text-charcoal/70">
          We&apos;ll hide these cuisines from your pool.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 sm:gap-3 sm:mt-6">
          {CUISINES.map((cuisine, index) => {
            const isSelected = blockedSet.has(cuisine)
            const rotationClass =
              BLOCKLIST_CHIP_ROTATIONS[index % BLOCKLIST_CHIP_ROTATIONS.length]
            return (
              <motion.button
                key={cuisine}
                type="button"
                onClick={() => void toggleCuisine(cuisine)}
                whileTap={{ scale: 0.95 }}
                className={`inline-flex min-h-[44px] items-center rounded-lg border-2 border-charcoal px-4 py-2 text-sm sm:text-base font-bold ${rotationClass} ${
                  isSelected ? 'bg-primary text-white shadow-small' : 'bg-white text-charcoal'
                }`}
              >
                {cuisine}
              </motion.button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
