'use client'

import { useSessionStore } from '@/stores/session-store'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'
import GreetingSplash from '@/components/session/GreetingSplash'
import { AnimatePresence, motion } from 'motion/react'

export default function Home() {
  const hasHydrated = useSessionStore((s) => s._hasHydrated)
  const onboardingComplete = useSessionStore((s) => s.preferences.onboardingComplete)
  const setupComplete = useSessionStore((s) => s.session.setupComplete)

  if (!hasHydrated) return null
  if (!onboardingComplete) return <OnboardingFlow />

  const handleSessionStart = () => {
    useSessionStore.getState().startSession([], null)
  }

  return (
    <AnimatePresence mode="wait">
      {!setupComplete ? (
        <GreetingSplash key="greeting" onComplete={handleSessionStart} />
      ) : (
        <motion.main
          key="discovery"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto border-x-2 border-charcoal"
        >
          {/* Discovery placeholder — replaced in Phase 5/6 */}
          <h1 className="font-heading text-charcoal text-4xl font-extrabold tracking-[-0.04em] leading-[0.85] uppercase text-center">
            Aaj Kya Khana Hai?
          </h1>
          <p className="font-sans text-charcoal/80 text-lg mt-4 text-center normal-case">
            Recipes loading soon...
          </p>
        </motion.main>
      )}
    </AnimatePresence>
  )
}
