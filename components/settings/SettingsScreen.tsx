'use client'

import { useCallback, useMemo } from 'react'
import { motion } from 'motion/react'
import { useSessionStore } from '@/stores/session-store'
import { DIET_OPTIONS } from '@/lib/constants/diets'
import { BLOCKLIST_CHIP_ROTATIONS, CUISINES } from '@/lib/constants/cuisines'
interface SettingsScreenProps {
  onBack: () => void
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const diet = useSessionStore((s) => s.preferences.diet)
  const blocklist = useSessionStore((s) => s.preferences.blocklist)
  const setDiet = useSessionStore((s) => s.setDiet)
  const setBlocklist = useSessionStore((s) => s.setBlocklist)

  const blockedSet = useMemo(() => new Set(blocklist), [blocklist])

  const toggleCuisine = useCallback(
    (cuisine: string) => {
      const prev = useSessionStore.getState().preferences.blocklist
      const next = new Set(prev)
      if (next.has(cuisine)) next.delete(cuisine)
      else next.add(cuisine)
      setBlocklist([...next])
    },
    [setBlocklist],
  )

  return (
    <div className="flex min-h-screen flex-col max-w-md mx-auto border-x-2 border-charcoal bg-bg-light">
      <header className="flex shrink-0 items-center gap-4 border-b-2 border-charcoal p-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to discovery"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-charcoal bg-white hover:bg-primary/10 transition-colors"
        >
          <span className="material-symbols-outlined text-charcoal">arrow_back</span>
        </button>
        <h1 className="font-heading text-2xl font-black uppercase tracking-tight text-charcoal">
          Settings
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-28">
        <section className="mt-8">
          <h2 className="font-heading text-xl font-black uppercase tracking-tight text-charcoal">
            Diet
          </h2>
          <p className="mt-2 font-sans text-sm font-medium text-charcoal/70">
            Recipes shown match this preference.
          </p>
          <div className="mt-6 flex gap-3">
            {DIET_OPTIONS.map((option) => {
              const isSelected = diet === option.value
              return (
                <motion.div
                  key={option.value}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDiet(option.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setDiet(option.value)
                    }
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex flex-1 flex-col items-center justify-between rounded-xl border-2 border-charcoal p-4 cursor-pointer select-none ${
                    isSelected ? 'bg-primary shadow-medium' : 'bg-white'
                  }`}
                >
                  <div
                    className="flex aspect-square w-full items-center justify-center rounded-full border-2 border-charcoal"
                    style={{ backgroundColor: option.iconBg }}
                  >
                    <span
                      className="material-symbols-outlined text-4xl text-charcoal"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {option.icon}
                    </span>
                  </div>
                  <p
                    className={`mt-3 text-center text-xs font-extrabold uppercase tracking-tighter ${
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

        <section className="mt-12">
          <h2 className="font-heading text-xl font-black uppercase tracking-tight text-charcoal">
            Cuisine blocklist
          </h2>
          <p className="mt-2 font-sans text-sm font-medium text-charcoal/70">
            We&apos;ll hide these cuisines from your pool.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {CUISINES.map((cuisine, index) => {
              const isSelected = blockedSet.has(cuisine)
              const rotationClass =
                BLOCKLIST_CHIP_ROTATIONS[index % BLOCKLIST_CHIP_ROTATIONS.length]
              return (
                <motion.button
                  key={cuisine}
                  type="button"
                  onClick={() => toggleCuisine(cuisine)}
                  whileTap={{ scale: 0.95 }}
                  className={`inline-flex min-h-[44px] items-center rounded-lg border-2 border-charcoal px-5 py-2.5 font-bold text-base ${rotationClass} ${
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

      <div className="sticky bottom-0 border-t-2 border-charcoal bg-bg-light p-4">
        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-xl border-2 border-charcoal bg-primary py-4 font-heading text-lg font-black uppercase tracking-widest text-white shadow-medium transition-transform active:translate-y-0.5"
        >
          Done
        </button>
      </div>
    </div>
  )
}
