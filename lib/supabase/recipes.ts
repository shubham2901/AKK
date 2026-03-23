import { supabase } from './client'
import type { Recipe, RecipeVideo, DietPreference } from '@/lib/types/database.types'

const PAGE_SIZE = 1000

function recipesQueryForDiet(diet: DietPreference | null) {
  let query = supabase.from('recipes').select('*')

  if (diet === 'Vegetarian') {
    query = query.contains('diet_tags', ['Vegetarian'])
  } else if (diet === 'Eggetarian') {
    query = query.contains('diet_tags', ['Eggetarian'])
  } else if (diet === 'Non-Veg') {
    query = query.or('diet_tags.cs.{"Non-Vegetarian"},diet_tags.cs.{"Non-Veg"}')
  }

  return query.order('popularity_score', { ascending: false })
}

/** Fetches all matching rows (paginated). Previously capped at 500, which made the deck feel tiny. */
export async function fetchRecipes(diet: DietPreference | null): Promise<Recipe[]> {
  const rows: Recipe[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await recipesQueryForDiet(diet).range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    const batch = (data ?? []) as Recipe[]
    rows.push(...batch)
    if (batch.length < PAGE_SIZE) break
  }
  return rows
}

export async function fetchVideosForRecipe(recipeId: number): Promise<RecipeVideo[]> {
  const { data, error } = await supabase
    .from('recipe_videos')
    .select('*')
    .eq('recipe_id', recipeId)
    .order('views', { ascending: false })

  if (error) throw error
  return (data ?? []) as RecipeVideo[]
}
