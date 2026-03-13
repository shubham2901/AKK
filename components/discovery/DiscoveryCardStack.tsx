'use client'

import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react'
import { useSessionStore, filterPool } from '@/stores/session-store'
import { DiscoveryCard } from './DiscoveryCard'
import type { Recipe } from '@/lib/types/database.types'

const SWIPE_THRESHOLD = 0.2
const VELOCITY_THRESHOLD = 500
const EXIT_DISTANCE = 400
const COMMIT_SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const SNAP_SPRING = { type: 'spring' as const, stiffness: 400, damping: 40 }

export interface DiscoveryCardStackProps {
  onCardTap?: (recipe: Recipe) => void
}

export function DiscoveryCardStack({ onCardTap }: DiscoveryCardStackProps) {
  const pool = useSessionStore((s) => s.session.pool)
  const cuisineFilter = useSessionStore((s) => s.session.cuisineFilter)
  const mealTypeFilter = useSessionStore((s) => s.session.mealTypeFilter)
  const currentIndex = useSessionStore((s) => s.session.currentIndex)
  const nextCard = useSessionStore((s) => s.nextCard)
  const prevCard = useSessionStore((s) => s.prevCard)
  const setCurrentIndex = useSessionStore((s) => s.setCurrentIndex)

  const filteredPool = useMemo(
    () => filterPool(pool, cuisineFilter, mealTypeFilter),
    [pool, cuisineFilter, mealTypeFilter],
  )

  const [dimensions, setDimensions] = useState({ width: 300, height: 500 })
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: typeof window !== 'undefined' ? window.innerWidth : 300,
        height: typeof window !== 'undefined' ? window.innerHeight : 500,
      })
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const clampedIndex = useMemo(() => {
    if (filteredPool.length === 0) return 0
    return Math.min(Math.max(0, currentIndex), filteredPool.length - 1)
  }, [filteredPool.length, currentIndex])

  useEffect(() => {
    if (filteredPool.length > 0 && clampedIndex !== currentIndex) {
      setCurrentIndex(clampedIndex)
    }
  }, [clampedIndex, currentIndex, filteredPool.length, setCurrentIndex])

  const currentRecipe = filteredPool[clampedIndex] ?? null

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  function handleDragEnd(
    _: PointerEvent,
    info: { offset: { x: number; y: number }; velocity: { x: number; y: number } },
  ) {
    const { offset, velocity } = info
    const thresholdX = dimensions.width * SWIPE_THRESHOLD
    const thresholdY = dimensions.height * SWIPE_THRESHOLD

    const absX = Math.abs(offset.x)
    const absY = Math.abs(offset.y)
    const absVelX = Math.abs(velocity.x)
    const absVelY = Math.abs(velocity.y)

    const dominantHorizontal = absX >= absY
    const committed =
      dominantHorizontal
        ? absX > thresholdX || absVelX > VELOCITY_THRESHOLD
        : absY > thresholdY || absVelY > VELOCITY_THRESHOLD

    if (!committed) {
      animate(x, 0, SNAP_SPRING)
      animate(y, 0, SNAP_SPRING)
      return
    }

    if (dominantHorizontal) {
      const exitX = offset.x > 0 ? EXIT_DISTANCE : -EXIT_DISTANCE
      animate(x, exitX, COMMIT_SPRING).then(() => {
        if (offset.x > 0) {
          nextCard(filteredPool.length)
        } else {
          prevCard(filteredPool.length)
        }
        x.set(0)
        y.set(0)
      })
      animate(y, 0, SNAP_SPRING)
    } else {
      const exitY = offset.y < 0 ? -EXIT_DISTANCE : EXIT_DISTANCE
      animate(y, exitY, COMMIT_SPRING).then(() => {
        if (offset.y < 0) {
          nextCard(filteredPool.length)
        } else {
          prevCard(filteredPool.length)
        }
        x.set(0)
        y.set(0)
      })
      animate(x, 0, SNAP_SPRING)
    }
  }

  if (filteredPool.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-6">
        <p className="font-sans text-charcoal/80 text-lg text-center">
          No recipes match your filters.
        </p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden touch-none">
      <AnimatePresence mode="wait" initial={false}>
        {currentRecipe && (
          <motion.div
            key={currentRecipe.id}
            className="absolute inset-0 touch-none"
            style={{ x, y, touchAction: 'none' }}
            drag
            dragDirectionLock
            dragElastic={0.2}
            dragTransition={{ bounceStiffness: 600, bounceDamping: 10 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
          >
            <DiscoveryCard
              recipe={currentRecipe}
              onTap={() => onCardTap?.(currentRecipe)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
