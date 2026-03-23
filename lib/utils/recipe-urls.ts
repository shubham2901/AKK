const RECIPE_DOMAIN_PATTERN =
  /https?:\/\/(?:www\.)?(hebbarskitchen\.com|archanaskitchen\.com|sanjeevkapoor\.com)[^\s"')]*/gi

const KNOWN_DOMAINS: Record<string, string> = {
  'hebbarskitchen.com': "Hebbar's Kitchen",
  'archanaskitchen.com': "Archana's Kitchen",
  'sanjeevkapoor.com': 'Sanjeev Kapoor',
}

/**
 * Extract web recipe URL from description when web_recipe_link is null.
 */
export function extractWebRecipeUrl(description: string | null): string | null {
  if (!description) return null
  const match = description.match(RECIPE_DOMAIN_PATTERN)
  return match ? match[0] : null
}

/**
 * Get web attribution from parsed hostname.
 */
export function getWebAttributionFromUrl(url: string | null): string {
  if (!url) return ''
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return KNOWN_DOMAINS[host] ?? host.replace(/\.com$/, '')
  } catch {
    return ''
  }
}
