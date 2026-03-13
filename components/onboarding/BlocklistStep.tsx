'use client'

import { useState, useCallback } from 'react'
import { motion } from 'motion/react'
import { useSessionStore } from '@/stores/session-store'

const CUISINES = [
  'North Indian',
  'South Indian',
  'Punjabi',
  'Gujarati',
  'Rajasthani',
  'Bengali',
  'Maharashtrian',
  'Kerala',
  'Hyderabadi',
  'Mughlai',
  'Chinese',
  'Indo-Chinese',
  'Italian',
  'Street Food',
  'Fusion',
] as const

const ROTATIONS = [
  'rotate-[2deg]',
  '-rotate-[1.5deg]',
  'rotate-[3deg]',
  '-rotate-[2.5deg]',
  'rotate-[1deg]',
]

interface BlocklistStepProps {
  onComplete: () => void
  onBack: () => void
}

export default function BlocklistStep({ onComplete, onBack }: BlocklistStepProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggleCuisine = useCallback((cuisine: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(cuisine)) {
        next.delete(cuisine)
      } else {
        next.add(cuisine)
      }
      return next
    })
  }, [])

  const handleDone = useCallback(() => {
    useSessionStore.getState().setBlocklist([...selected])
    useSessionStore.getState().completeOnboarding()
    onComplete()
  }, [selected, onComplete])

  const handleSkip = useCallback(() => {
    useSessionStore.getState().setBlocklist([])
    useSessionStore.getState().completeOnboarding()
    onComplete()
  }, [onComplete])

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="size-10 rounded-full border-2 border-charcoal flex items-center justify-center bg-white hover:bg-primary/10 transition-colors"
        >
          <span className="material-symbols-outlined text-charcoal">arrow_back</span>
        </button>
        <div className="text-sm font-bold tracking-widest uppercase text-charcoal">
          Step 2 of 2
        </div>
        <div className="w-10 shrink-0" />
      </div>

      {/* Headline */}
      <div className="mt-8">
        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold leading-[0.9] tracking-tight uppercase text-charcoal">
          ANYTHING YOU&apos;LL&nbsp;
          <span className="text-primary italic">NEVER</span>
          &nbsp;TOUCH?
        </h1>
        <p className="text-lg font-medium opacity-80 leading-snug mt-4 text-charcoal">
          We&apos;ll hide these forever. No judgment.
        </p>
      </div>

      {/* Asymmetric tag cloud */}
      <div className="flex flex-wrap gap-3 items-start content-start flex-1 mt-8 mb-24">
        {CUISINES.map((cuisine, index) => {
          const isSelected = selected.has(cuisine)
          const rotationClass = ROTATIONS[index % ROTATIONS.length]
          return (
            <motion.button
              key={cuisine}
              type="button"
              onClick={() => toggleCuisine(cuisine)}
              whileTap={{ scale: 0.95 }}
              className={`inline-block px-5 py-2.5 border-2 border-charcoal rounded-lg font-bold text-base min-h-[44px] flex items-center ${rotationClass} ${
                isSelected ? 'bg-primary text-white shadow-small' : 'bg-white text-charcoal'
              }`}
            >
              {cuisine}
            </motion.button>
          )
        })}
      </div>

      {/* Bottom area */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-light to-transparent pt-12 max-w-md mx-auto">
        <button
          type="button"
          onClick={handleDone}
          className="w-full py-5 bg-primary border-2 border-charcoal shadow-large rounded-xl font-heading font-bold uppercase text-white flex items-center justify-between px-8 active:translate-y-1 active:shadow-none transition-all"
        >
          <span>I&apos;m done</span>
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            arrow_forward
          </span>
        </button>
        <button
          type="button"
          onClick={handleSkip}
          className="text-sm font-semibold text-charcoal/60 mt-3 text-center w-full block"
        >
          Skip — I eat everything
        </button>
      </div>
    </div>
  )
}
