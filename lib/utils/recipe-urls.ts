import type { Recipe } from '@/lib/types/database.types'

const RECIPE_DOMAIN_PATTERN =
  /https?:\/\/(?:www\.)?(hebbarskitchen\.com|archanaskitchen\.com|sanjeevkapoor\.com)[^\s"')]*/gi

const KNOWN_DOMAINS: Record<string, string> = {
  'hebbarskitchen.com': "Hebbar's Kitchen",
  'archanaskitchen.com': "Archana's Kitchen",
  'sanjeevkapoor.com': 'Sanjeev Kapoor',
}

/**
 * Extract web recipe URL from description when web_recipe_link is null.
 * Matches known domains: hebbarskitchen.com, archanaskitchen.com, sanjeevkapoor.com
 */
export function extractWebRecipeUrl(description: string | null): string | null {
  if (!description) return null
  const match = description.match(RECIPE_DOMAIN_PATTERN)
  return match ? match[0] : null
}

/**
 * Get YouTube attribution: "YouTube / {title}" or "YouTube" if title is null
 */
export function getYouTubeAttribution(recipe: Recipe): string {
  const title = recipe.title?.trim()
  return title ? `YouTube / ${title}` : 'YouTube'
}

/**
 * Get web attribution from parsed hostname.
 * Uses web_recipe_link or extractWebRecipeUrl(description).
 * Returns mapped name for known domains or hostname without www.
 */
export function getWebAttribution(recipe: Recipe): string {
  const url =
    recipe.web_recipe_link ?? extractWebRecipeUrl(recipe.description ?? null)
  if (!url) return ''
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return KNOWN_DOMAINS[host] ?? host.replace(/\.com$/, '')
  } catch {
    return ''
  }
}
