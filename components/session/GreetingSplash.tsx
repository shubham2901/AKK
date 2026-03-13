'use client'

import { useEffect } from 'react'
import { motion } from 'motion/react'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good morning.'
  if (hour >= 12 && hour < 17) return 'Good afternoon.'
  if (hour >= 17 && hour < 21) return 'Good evening.'
  return 'Late night cravings?'
}

interface GreetingSplashProps {
  onComplete: () => void
}

export default function GreetingSplash({ onComplete }: GreetingSplashProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="min-h-screen flex flex-col justify-center max-w-md mx-auto p-6"
    >
      <p className="text-charcoal/60 text-lg font-medium leading-normal mb-2">
        {getGreeting()}
      </p>
      <h1 className="font-heading text-5xl sm:text-6xl font-extrabold leading-[0.9] tracking-tight uppercase text-charcoal">
        What&apos;s for dinner?
      </h1>
    </motion.div>
  )
}
