import type { Recipe } from '@/lib/types/database.types'

/**
 * Drops recipes whose cuisine tags (or single cuisine field) intersect the user's blocklist.
 * Blocklist strings match onboarding chip labels (case-sensitive).
 */
export function filterRecipesByBlocklist(
  recipes: Recipe[],
  blocklist: string[],
): Recipe[] {
  if (blocklist.length === 0) return recipes
  const blocked = new Set(blocklist)
  return recipes.filter((r) => {
    const tags = r.cuisine_tags ?? []
    const hitTag = tags.some((t) => blocked.has(t))
    const hitSingle = r.cuisine != null && blocked.has(r.cuisine)
    return !hitTag && !hitSingle
  })
}
