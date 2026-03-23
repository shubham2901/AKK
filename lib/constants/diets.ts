import type { DietPreference } from '@/lib/types/database.types'

export const DIET_OPTIONS: {
  value: DietPreference
  label: string
  icon: string
  secondaryIcon?: string
  iconBg: string
}[] = [
  { value: 'Vegetarian', label: 'Veg', icon: 'eco', iconBg: '#A8E6CF' },
  { value: 'Non-Veg', label: 'Non-Veg', icon: 'kebab_dining', iconBg: '#FFD3B6' },
  { value: 'Eggetarian', label: 'Eggetarian', icon: 'egg_alt', secondaryIcon: 'eco', iconBg: '#FFF3B0' },
]
