'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useDragControls } from 'motion/react'
import Image from 'next/image'
import { useSessionStore } from '@/stores/session-store'
import { logInteraction } from '@/services/interaction-logger'
import { saveYoutubeOpen } from '@/lib/utils/youtube-tracker'
import { fetchVideosForRecipe } from '@/lib/supabase/recipes'
import type { Recipe, RecipeVideo } from '@/lib/types/database.types'

function triggerHaptic() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(10)
    } catch {
      // ignore
    }
  }
}

export interface RecipeDetailOverlayProps {
  recipe: Recipe
  open: boolean
  onClose: () => void
}

export default function RecipeDetailOverlay({
  recipe,
  open,
  onClose,
}: RecipeDetailOverlayProps) {
  const sessionId = useSessionStore((s) => s.sessionId)
  const togglePick = useSessionStore((s) => s.togglePick)
  const pickedIds = useSessionStore((s) => s.pickedIds)
  const dragControls = useDragControls()
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [videos, setVideos] = useState<RecipeVideo[]>([])

  const isPicked = pickedIds.includes(recipe.id)

  useEffect(() => {
    if (open) {
      fetchVideosForRecipe(recipe.id)
        .then(setVideos)
        .catch((err) => console.error('[RecipeDetailOverlay] video fetch', err))
    }
  }, [open, recipe.id])

  const handleClose = useCallback(() => {
    logInteraction(sessionId, 'back_no_action', recipe.id)
    onClose()
  }, [sessionId, recipe.id, onClose])

  const handleFoundMyPick = useCallback(() => {
    const nextPicked = !isPicked
    togglePick(recipe.id)
    triggerHaptic()
    setToastMessage(nextPicked ? 'Added to shortlist' : 'Removed from shortlist')
    setToastVisible(true)
    logInteraction(sessionId, 'found_my_pick', recipe.id, { picked: nextPicked })
  }, [isPicked, recipe.id, sessionId, togglePick])

  useEffect(() => {
    if (toastVisible) {
      const t = setTimeout(() => setToastVisible(false), 2000)
      return () => clearTimeout(t)
    }
  }, [toastVisible])

  const primaryVideo = videos[0] ?? null
  const youtubeUrl = primaryVideo?.url ?? null
  const webUrl = primaryVideo?.web_recipe_link ?? null
  const youtubeAttribution = primaryVideo
    ? `YouTube / ${primaryVideo.channel_name ?? primaryVideo.title ?? 'Video'}`
    : 'YouTube'

  const name = recipe.recipe_name_english ?? 'Recipe'
  const cookTime = recipe.cook_time_minutes
  const difficulty = recipe.difficulty
  const cuisineLabel = recipe.cuisine?.[0] ?? null
  const cookTimeLabel = cookTime ? `${cookTime} Mins` : null

  const imageUrl = recipe.image_path || recipe.hero_image
  const isValidImage =
    imageUrl &&
    (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))

  return (
    <>
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-bg-light rounded-t-2xl border-t-2 border-charcoal shadow-large"
        style={{ top: 48, height: 'calc(100dvh - 48px)' }}
        initial={false}
        animate={{ y: open ? 0 : '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        drag={open ? 'y' : false}
        dragControls={dragControls}
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100 || info.velocity.y > 500) handleClose()
        }}
      >
        <div
          className="flex shrink-0 cursor-grab active:cursor-grabbing touch-none py-3"
          onPointerDown={(e) => dragControls.start(e)}
          aria-hidden
        >
          <div className="mx-auto h-1.5 w-12 rounded-full bg-charcoal/30" />
        </div>

        <div className="flex flex-col overflow-y-auto pb-32" style={{ height: 'calc(100% - 48px)' }}>
          <nav className="flex shrink-0 items-center px-6 pb-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center gap-2 group"
              aria-label="Back"
            >
              <span className="material-symbols-outlined text-charcoal">
                arrow_back
              </span>
              <span className="font-bold text-sm uppercase tracking-widest text-charcoal group-hover:underline">
                Back
              </span>
            </button>
          </nav>

          <div className="px-4">
            <div className="w-full aspect-square md:aspect-video border-2 border-charcoal bg-charcoal overflow-hidden rounded-xl">
              {isValidImage ? (
                <Image
                  src={imageUrl}
                  alt={name}
                  width={800}
                  height={600}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="h-full w-full bg-charcoal" />
              )}
            </div>
          </div>

          <main className="px-6 pt-8">
            <div className="flex flex-col gap-6">
              <h1 className="font-heading font-black text-6xl md:text-8xl text-charcoal uppercase leading-[0.9] tracking-[-0.04em]">
                {(() => {
                  const words = name.split(/\s+/).filter(Boolean)
                  if (words.length <= 1) return name
                  return (
                    <>
                      {words[0]}
                      <br />
                      {words.slice(1).join(' ')}
                    </>
                  )
                })()}
              </h1>

              <div className="flex flex-wrap gap-2">
                {cookTimeLabel && (
                  <span className="px-4 py-1 border-2 border-primary rounded-lg text-primary font-bold text-xs uppercase tracking-tighter">
                    {cookTimeLabel}
                  </span>
                )}
                {difficulty && (
                  <span className="px-4 py-1 border-2 border-primary rounded-lg text-primary font-bold text-xs uppercase tracking-tighter">
                    {difficulty}
                  </span>
                )}
                {cuisineLabel && (
                  <span className="px-4 py-1 border-2 border-primary rounded-lg text-primary font-bold text-xs uppercase tracking-tighter">
                    {cuisineLabel}
                  </span>
                )}
              </div>

              {recipe.one_line_hook && (
                <p className="text-xl font-medium leading-tight text-charcoal/80 max-w-xl">
                  {recipe.one_line_hook}
                </p>
              )}

              <div className="h-[2px] bg-charcoal w-full mt-4" />

              <div className="flex flex-col gap-4 mt-4">
                <h3 className="font-bold uppercase tracking-widest text-sm text-charcoal/60">
                  Follow the guides
                </h3>

                {youtubeUrl && (
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-5 border-2 border-charcoal bg-white hover:bg-primary/5 transition-colors rounded-xl"
                    onClick={() => {
                      logInteraction(sessionId, 'youtube_open', recipe.id)
                      saveYoutubeOpen(sessionId, recipe.id)
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center bg-primary rounded-lg text-white">
                        <span className="material-symbols-outlined">
                          play_circle
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-lg leading-none">
                          Video Tutorial
                        </p>
                        <p className="text-xs font-bold uppercase text-charcoal/50 mt-1">
                          {youtubeAttribution}
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined">
                      north_east
                    </span>
                  </a>
                )}

                {webUrl && (
                  <a
                    href={webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-5 border-2 border-charcoal bg-white hover:bg-primary/5 transition-colors rounded-xl"
                    onClick={() =>
                      logInteraction(sessionId, 'web_open', recipe.id)
                    }
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center bg-charcoal rounded-lg text-white">
                        <span className="material-symbols-outlined">
                          menu_book
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-lg leading-none">
                          Step-by-Step Article
                        </p>
                        <p className="text-xs font-bold uppercase text-charcoal/50 mt-1">
                          {primaryVideo?.channel_name ?? 'Recipe website'}
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined">
                      north_east
                    </span>
                  </a>
                )}

                {!youtubeUrl && !webUrl && (
                  <p className="text-sm text-charcoal/50 italic">
                    No video or article linked yet for this recipe.
                  </p>
                )}
              </div>
            </div>
          </main>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-light via-bg-light to-transparent pointer-events-none">
          <div className="pointer-events-auto">
            <button
              type="button"
              onClick={handleFoundMyPick}
              className={`w-full py-5 border-2 border-charcoal font-heading font-black text-xl uppercase tracking-widest rounded-xl transition-colors ${
                isPicked
                  ? 'bg-charcoal/20 text-charcoal'
                  : 'bg-primary text-white hover:translate-y-[-2px] active:translate-y-0'
              }`}
            >
              {isPicked ? 'Picked ✓' : 'Found my pick'}
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {toastVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-xl border-2 border-charcoal bg-bg-light shadow-large font-semibold text-charcoal"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
