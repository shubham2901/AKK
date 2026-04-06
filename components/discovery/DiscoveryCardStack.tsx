'use client'

import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react'
import { useSessionStore, filterPool } from '@/stores/session-store'
import { logInteraction } from '@/services/interaction-logger'
import { triggerEagerRecipeImageGeneration } from '@/lib/recipe-image-pipeline'
import { getRecipeImageUrl } from '@/lib/utils/recipe-image-url'
import { DiscoveryCard } from './DiscoveryCard'
import type { Recipe } from '@/lib/types/database.types'

const SWIPE_THRESHOLD = 0.2
const VELOCITY_THRESHOLD = 500
/** Snappy exit: springs with low damping stay “alive” for hundreds of ms after the finger lifts. */
const COMMIT_EXIT = { type: 'tween' as const, duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as const }
const SNAP_SPRING = { type: 'spring' as const, stiffness: 400, damping: 40 }

export interface DiscoveryCardStackProps {
  onCardTap?: (recipe: Recipe) => void
  /** When true, arrow keys do not change cards (e.g. filter sheet or overlay open). */
  keyboardDisabled?: boolean
}

export function DiscoveryCardStack({ onCardTap, keyboardDisabled }: DiscoveryCardStackProps) {
  const sessionId = useSessionStore((s) => s.sessionId)
  const pickedIds = useSessionStore((s) => s.pickedIds)
  const viewedIds = useSessionStore((s) => s.viewedIds)
  const pool = useSessionStore((s) => s.session.pool)
  const cuisineFilter = useSessionStore((s) => s.session.cuisineFilter)
  const mealTypeFilter = useSessionStore((s) => s.session.mealTypeFilter)
  const recipeTypeFilter = useSessionStore((s) => s.session.recipeTypeFilter)
  const currentIndex = useSessionStore((s) => s.session.currentIndex)
  const nextCard = useSessionStore((s) => s.nextCard)
  const prevCard = useSessionStore((s) => s.prevCard)
  const setCurrentIndex = useSessionStore((s) => s.setCurrentIndex)

  const filteredPool = useMemo(
    () => filterPool(pool, cuisineFilter, mealTypeFilter, recipeTypeFilter),
    [pool, cuisineFilter, mealTypeFilter, recipeTypeFilter],
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

  useEffect(() => {
    if (filteredPool.length === 0) return
    const start = clampedIndex + 1
    const end = Math.min(start + 10, filteredPool.length)
    for (let i = start; i < end; i++) {
      const url = getRecipeImageUrl(filteredPool[i])
      if (url) {
        const img = new Image()
        img.src = url
      }
    }
  }, [clampedIndex, filteredPool])

  useEffect(() => {
    if (filteredPool.length === 0) return
    const start = clampedIndex + 1
    const end = Math.min(start + 6, filteredPool.length)
    const ids: number[] = []
    for (let i = start; i < end; i++) {
      ids.push(filteredPool[i].id)
    }
    triggerEagerRecipeImageGeneration(ids)
  }, [clampedIndex, filteredPool])

  useEffect(() => {
    if (keyboardDisabled) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
      const el = e.target as HTMLElement | null
      if (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable)
      ) {
        return
      }
      e.preventDefault()
      const len = filteredPool.length
      if (len === 0) return
      const ci = useSessionStore.getState().session.currentIndex
      const idx = Math.min(Math.max(0, ci), len - 1)
      const recipe = filteredPool[idx]
      if (e.key === 'ArrowUp') {
        logInteraction(sessionId, 'swipe_next', recipe?.id)
        nextCard(len)
      } else {
        logInteraction(sessionId, 'swipe_prev', recipe?.id)
        prevCard(len)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [keyboardDisabled, filteredPool, nextCard, prevCard, sessionId])

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
      const exitMag = dimensions.width * 1.08
      const exitX = offset.x > 0 ? exitMag : -exitMag
      const isNext = offset.x > 0
      animate(x, exitX, COMMIT_EXIT).then(() => {
        logInteraction(sessionId, isNext ? 'swipe_next' : 'swipe_prev', currentRecipe?.id)
        if (isNext) {
          nextCard(filteredPool.length)
        } else {
          prevCard(filteredPool.length)
        }
        x.set(0)
        y.set(0)
      })
      animate(y, 0, SNAP_SPRING)
    } else {
      const exitMag = dimensions.height * 1.08
      const exitY = offset.y < 0 ? -exitMag : exitMag
      const isNext = offset.y < 0
      animate(y, exitY, COMMIT_EXIT).then(() => {
        logInteraction(sessionId, isNext ? 'swipe_next' : 'swipe_prev', currentRecipe?.id)
        if (isNext) {
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
              priority
              isPicked={pickedIds.includes(currentRecipe.id)}
              isViewed={viewedIds.includes(currentRecipe.id)}
              onTap={() => {
                logInteraction(sessionId, 'tap', currentRecipe.id)
                onCardTap?.(currentRecipe)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
