import type { Recipe } from '@/lib/types/database.types'

/**
 * Drops recipes whose cuisine array values intersect the user's blocklist.
 * Blocklist strings match onboarding chip labels (case-sensitive).
 */
export function filterRecipesByBlocklist(
  recipes: Recipe[],
  blocklist: string[],
): Recipe[] {
  if (blocklist.length === 0) return recipes
  const blocked = new Set(blocklist)
  return recipes.filter((r) => {
    const tags = r.cuisine ?? []
    return !tags.some((t) => blocked.has(t))
  })
}
