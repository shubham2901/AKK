import type { DietPreference } from '@/lib/types/database.types'

export const DIET_OPTIONS: {
  value: DietPreference
  label: string
  icon: string
  iconBg: string
}[] = [
  { value: 'Vegetarian', label: 'Vegetarian', icon: 'eco', iconBg: '#A8E6CF' },
  { value: 'Non-Veg', label: 'Non-Veg', icon: 'kebab_dining', iconBg: '#FFD3B6' },
  { value: 'Vegan', label: 'Vegan', icon: 'potted_plant', iconBg: '#DCEDC1' },
]
