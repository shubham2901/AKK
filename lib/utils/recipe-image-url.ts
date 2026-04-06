import type { Recipe } from '@/lib/types/database.types'

/** Public HTTP(S) image URL for a recipe, or null if missing / not loadable by Next/Image. */
export function getRecipeImageUrl(recipe: Recipe): string | null {
  const imageUrl = recipe.image_path || recipe.hero_image
  if (!imageUrl) return null
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
  return null
}
