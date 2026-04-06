'use client'

import { useCallback, useMemo } from 'react'
import { motion } from 'motion/react'
import { useSessionStore } from '@/stores/session-store'
import { DIET_OPTIONS } from '@/lib/constants/diets'
import type { DietPreference } from '@/lib/types/database.types'
import { CuisineBlocklistChips } from '@/components/settings/CuisineBlocklistChips'

/** Flip to true to restore the “Hide cuisines I don’t want” block in Settings. */
const SHOW_HIDE_CUISINES_SECTION = false

export interface SettingsPreferencesContentProps {
  /** Called after diet or blocklist changes (e.g. refetch recipe pool). */
  onAfterPreferenceChange?: () => void | Promise<void>
  className?: string
  /** When false, only the diet section is rendered (e.g. filter sheet “More”). */
  showCuisineBlocklist?: boolean
}

export default function SettingsPreferencesContent({
  onAfterPreferenceChange,
  className = '',
  showCuisineBlocklist = true,
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
    async (value: DietPreference) => {
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
                className={`flex flex-1 flex-col items-center justify-between rounded-[12px] border-2 border-charcoal p-3 sm:p-4 cursor-pointer select-none min-w-0 ${
                  isSelected ? 'bg-primary text-white shadow-[4px_4px_0px_0px_#1C1C1E]' : 'bg-white'
                }`}
              >
                <div
                  className="flex aspect-square w-full max-w-[5rem] items-center justify-center gap-1 rounded-full border-2 border-charcoal mx-auto"
                  style={{ backgroundColor: option.iconBg }}
                >
                  <span
                    className={`material-symbols-outlined text-3xl sm:text-4xl ${isSelected ? 'text-white' : 'text-charcoal'}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {option.icon}
                  </span>
                  {option.secondaryIcon && (
                    <span
                      className={`material-symbols-outlined text-xl sm:text-2xl ${isSelected ? 'text-white' : 'text-charcoal'}`}
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

      {SHOW_HIDE_CUISINES_SECTION && showCuisineBlocklist && (
        <section className="mt-8 sm:mt-10">
          <h2 className="font-heading text-lg font-black uppercase tracking-tight text-charcoal sm:text-xl">
            Hide cuisines I don&apos;t want
          </h2>
          <p className="mt-2 font-sans text-sm font-medium text-charcoal/70">
            We&apos;ll hide these cuisines from your pool.
          </p>
          <CuisineBlocklistChips
            variant="settings"
            selectedSet={blockedSet}
            onToggle={(cuisine) => void toggleCuisine(cuisine)}
          />
        </section>
      )}
    </div>
  )
}
