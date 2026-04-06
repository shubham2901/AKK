/**
 * Maps filter UI to DB `meal_time` / `recipe_type` values (no schema changes).
 */

export type MomentId = 'breakfast' | 'lunch' | 'dinner'

/** DB values in `meal_time` arrays — breakfast groups brunch; dinner groups evening tea + snacks. */
export const MOMENT_MEAL_TIMES: Record<MomentId, readonly string[]> = {
  breakfast: ['Breakfast', 'Brunch'],
  lunch: ['Lunch'],
  dinner: ['Evening Tea', 'Snacks', 'Snack', 'Dinner'],
}

export const MOMENT_LABELS: Record<MomentId, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
}

/** Infer selected moment from stored `mealTypeFilter` (exact set match). */
export function getMomentFromMealFilter(mealTypeFilter: string[]): MomentId | null {
  for (const id of Object.keys(MOMENT_MEAL_TIMES) as MomentId[]) {
    const expected = MOMENT_MEAL_TIMES[id]
    if (expected.length !== mealTypeFilter.length) continue
    const set = new Set(mealTypeFilter)
    if (expected.every((m) => set.has(m))) return id
  }
  return null
}

export function setMomentMealTypeFilter(moment: MomentId | null): string[] {
  if (!moment) return []
  return [...MOMENT_MEAL_TIMES[moment]]
}

export type RecipeCategoryId = 'mains' | 'sides' | 'beverages' | 'desserts'

/** Substrings matched against `recipe_type` (pipe-separated in DB). */
export const RECIPE_CATEGORY_SUBSTRINGS: Record<RecipeCategoryId, readonly string[]> = {
  mains: ['Main Course', 'Rice', 'Dal'],
  sides: [
    'Accompaniment',
    'Bread',
    'Salad',
    'Soup',
    'Snack',
    'Snacks',
    'Side Dish',
    'Appetizer',
  ],
  beverages: ['Beverage'],
  desserts: ['Dessert'],
}

export const RECIPE_CATEGORY_LABELS: Record<RecipeCategoryId, string> = {
  mains: 'Mains',
  sides: 'Sides',
  beverages: 'Beverages',
  desserts: 'Desserts',
}

const CATEGORY_KEYS = new Set<string>(Object.keys(RECIPE_CATEGORY_SUBSTRINGS))

export function recipeMatchesCategoryFilter(
  recipeType: string | null | undefined,
  recipeTypeFilter: string[],
): boolean {
  if (recipeTypeFilter.length === 0) return true
  if (recipeType == null || recipeType.length === 0) return false
  return recipeTypeFilter.some((key) => {
    if (CATEGORY_KEYS.has(key)) {
      const subs = RECIPE_CATEGORY_SUBSTRINGS[key as RecipeCategoryId]
      return subs.some((sub) => recipeType.includes(sub))
    }
    return recipeType.includes(key)
  })
}
