import { supabase } from '@/lib/supabase/client'

export function syncSession(
  sessionId: string,
  dietPreference: string | null,
  cuisineBlocklist: string[],
  cuisineFilter: string[],
  mealTypeFilter: string[],
  ingredientFilter: string | null,
) {
  if (sessionId.length < 8) return

  supabase
    .from('user_sessions')
    .insert({
      session_id: sessionId,
      diet_preference: dietPreference,
      cuisine_blocklist: cuisineBlocklist,
      cuisine_filter: cuisineFilter,
      meal_type_filter: mealTypeFilter?.join(',') || null,
      ingredient_filter: ingredientFilter,
    })
    .then(({ error }) => {
      if (error) console.error('[session-sync]', error.message)
    })
}
