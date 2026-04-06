'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Recipe } from '@/lib/types/database.types'
import { getRecipeImageUrl } from '@/lib/utils/recipe-image-url'

export interface DiscoveryCardProps {
  recipe: Recipe
  isPicked?: boolean
  isViewed?: boolean
  onTap?: () => void
  /** LCP image: current card in stack. */
  priority?: boolean
}

const INFO_OVERLAP_PX = 52

export function DiscoveryCard({
  recipe,
  isPicked,
  isViewed,
  onTap,
  priority = false,
}: DiscoveryCardProps) {
  const name = recipe.recipe_name_english ?? 'Recipe'
  const hook = recipe.one_line_hook ?? ''
  const chips = [
    ...(recipe.cuisine ?? []).slice(0, 2),
    ...(recipe.diet_tags ?? []).slice(0, 1),
  ].slice(0, 3)

  const imageUrl = getRecipeImageUrl(recipe)
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-[var(--radius-default)] touch-none bg-bg-light ${isViewed ? 'opacity-90' : ''}`}
      style={{ touchAction: 'none' }}
      onClick={onTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onTap?.()
        }
      }}
    >
      {isPicked && (
        <div className="absolute top-3 right-3 z-10 rounded-full bg-bg-light border-2 border-charcoal p-1 shadow-small">
          <span className="material-symbols-outlined text-lg text-charcoal">check_circle</span>
        </div>
      )}
      <div className="absolute inset-0">
        {imageUrl ? (
          <>
            {!imageLoaded && (
              <div
                className="discovery-card-shimmer absolute inset-0 z-0"
                aria-hidden
              />
            )}
            <Image
              src={imageUrl}
              alt={name}
              fill
              className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              sizes="100vw"
              draggable={false}
              unoptimized
              priority={priority}
              onLoad={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div
            className="discovery-card-shimmer h-full w-full"
            aria-hidden
          />
        )}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-44 bg-gradient-to-t from-bg-light via-bg-light/75 to-transparent"
          aria-hidden
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-[2] px-4 pb-4">
        <div
          className="rounded-[var(--radius-default)] border-2 border-charcoal bg-bg-light p-4"
          style={{
            boxShadow: 'var(--shadow-small)',
            marginTop: -INFO_OVERLAP_PX,
          }}
        >
          <h2 className="font-heading text-2xl font-extrabold leading-tight text-charcoal md:text-3xl">
            {name}
          </h2>
          {hook && (
            <p className="mt-2 text-base font-medium text-charcoal/90 md:text-lg">
              {hook}
            </p>
          )}
          {chips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-[var(--radius-default)] border-2 border-charcoal px-3 py-1 text-xs font-bold uppercase tracking-wider text-charcoal"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
