'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import DietStep from './DietStep'

export default function OnboardingFlow() {
  const [step, setStep] = useState(0)

  return (
    <AnimatePresence mode="wait">
      {step === 0 && (
        <motion.div
          key="diet"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <DietStep onNext={() => setStep(1)} />
        </motion.div>
      )}
      {step === 1 && (
        <motion.div
          key="blocklist"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto border-x-2 border-charcoal"
        >
          <p className="font-sans text-charcoal text-lg">Blocklist step coming in 03-02</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
