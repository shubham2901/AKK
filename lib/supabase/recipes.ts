import { supabase } from './client'
import type { Recipe, DietPreference } from '@/lib/types/database.types'

/**
 * Fetches recipes from Supabase with optional diet filter.
 * V0: diet filter only; blocklist/cuisine/ingredient deferred to Phase 6.
 */
export async function fetchRecipes(diet: DietPreference | null): Promise<Recipe[]> {
  let query = supabase.from('recipes').select('*')

  if (diet === 'Vegetarian') {
    query = query.contains('diet_tags', ['Vegetarian'])
  } else if (diet === 'Vegan') {
    query = query.contains('diet_tags', ['Vegan'])
  } else if (diet === 'Non-Veg') {
    query = query.contains('diet_tags', ['Non-Veg'])
  }
  // diet === null → no filter (fetch all)

  const { data, error } = await query.limit(50)
  if (error) throw error
  return (data ?? []) as Recipe[]
}
