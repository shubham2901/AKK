'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { useSessionStore } from '@/stores/session-store'
import { DIET_OPTIONS } from '@/lib/constants/diets'
import type { DietPreference } from '@/lib/types/database.types'

interface DietStepProps {
  onNext: () => void
}

export default function DietStep({ onNext }: DietStepProps) {
  const [selected, setSelected] = useState<DietPreference | null>(null)

  const handleNext = () => {
    if (selected) {
      useSessionStore.getState().setDiet(selected)
      onNext()
    }
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto border-x-2 border-charcoal">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <div className="w-12 shrink-0" />
        <div className="px-4 py-1 border-2 border-charcoal rounded-full bg-white text-sm font-extrabold uppercase tracking-wider text-charcoal">
          Step 1 of 2
        </div>
        <div className="w-12 shrink-0" />
      </div>

      {/* Headline */}
      <div className="px-6 py-8">
        <h1 className="font-heading text-6xl sm:text-7xl font-extrabold uppercase tracking-[-0.04em] leading-[0.85] text-charcoal">
          WHAT DO YOU <span className="text-primary">EAT?</span>
        </h1>
      </div>

      {/* Cards */}
      <div className="flex flex-1 gap-3 px-6 pb-8">
        {DIET_OPTIONS.map((option) => {
          const isSelected = selected === option.value
          return (
            <motion.div
              key={option.value}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(option.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelected(option.value)
                }
              }}
              whileTap={{ scale: 0.95 }}
              className={`flex-1 flex flex-col items-center justify-between p-4 border-2 border-charcoal rounded-xl cursor-pointer select-none ${
                isSelected ? 'bg-primary shadow-medium' : 'bg-white'
              }`}
            >
              <div
                className="w-full aspect-square rounded-full border-2 border-charcoal flex items-center justify-center gap-1"
                style={{ backgroundColor: option.iconBg }}
              >
                <span
                  className="material-symbols-outlined text-4xl text-charcoal"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {option.icon}
                </span>
                {option.secondaryIcon && (
                  <span
                    className="material-symbols-outlined text-2xl text-charcoal"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {option.secondaryIcon}
                  </span>
                )}
              </div>
              <p
                className={`text-sm font-extrabold uppercase tracking-tighter text-center ${
                  isSelected ? 'text-white' : 'text-charcoal'
                }`}
              >
                {option.label}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 p-6 bg-bg-light border-t-2 border-charcoal">
        <button
          type="button"
          onClick={handleNext}
          disabled={!selected}
          className={`w-full py-5 bg-primary border-2 border-charcoal rounded-xl font-heading font-bold uppercase italic text-white flex items-center justify-between px-8 transition-all ${
            selected
              ? 'shadow-medium active:translate-y-1 active:shadow-none'
              : 'opacity-50 pointer-events-none'
          }`}
        >
          <span>Let&apos;s go</span>
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  )
}
