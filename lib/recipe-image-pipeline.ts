/**
 * When recipe images are generated on demand (e.g. AI), call this to warm the next
 * few images before the user reaches them (current index + 1 … +5).
 * Wire to your API when the pipeline exists.
 */
export function triggerEagerRecipeImageGeneration(recipeIds: number[]): void {
  if (recipeIds.length === 0) return
  void recipeIds
  // Example: void fetch('/api/recipes/generate-images', { method: 'POST', body: JSON.stringify({ ids: recipeIds }) })
}
