'use client'

import Image from 'next/image'
import type { Recipe } from '@/lib/types/database.types'

export interface DiscoveryCardProps {
  recipe: Recipe
  onTap?: () => void
}

export function DiscoveryCard({ recipe, onTap }: DiscoveryCardProps) {
  const name = recipe.recipe_name_english ?? recipe.title ?? 'Recipe'
  const hook = recipe.one_line_hook ?? ''
  const chips = [
    ...(recipe.cuisine_tags ?? []).slice(0, 2),
    ...(recipe.diet_tags ?? []).slice(0, 1),
  ].slice(0, 3)

  const thumbnailUrl = recipe.thumbnail
  const isValidUrl =
    thumbnailUrl &&
    (thumbnailUrl.startsWith('http://') || thumbnailUrl.startsWith('https://'))

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[var(--radius-default)] touch-none"
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
      {/* Full-bleed photo */}
      <div className="absolute inset-0">
        {isValidUrl ? (
          <Image
            src={thumbnailUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="100vw"
            draggable={false}
            unoptimized
          />
        ) : (
          <div
            className="h-full w-full bg-charcoal/20"
            style={{ backgroundColor: 'var(--color-charcoal)' }}
          />
        )}
      </div>

      {/* Neo-brutalist text block at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div
          className="rounded-[var(--radius-default)] border-2 border-charcoal bg-bg-light p-4"
          style={{
            boxShadow: 'var(--shadow-small)',
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
