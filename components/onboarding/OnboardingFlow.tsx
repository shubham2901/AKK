'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import DietStep from './DietStep'
import BlocklistStep from './BlocklistStep'

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
          className="border-x-2 border-charcoal"
        >
          <BlocklistStep onComplete={() => {}} onBack={() => setStep(0)} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
