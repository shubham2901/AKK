import { supabase } from '@/lib/supabase/client'
import type { Json } from '@/lib/types/database.types'

const ALLOWED_ACTIONS = [
  'swipe_next',
  'swipe_prev',
  'tap',
  'youtube_open',
  'web_open',
  'found_my_pick',
  'back_no_action',
  'shuffle',
  'session_success_inferred',
  'filter_change',
] as const

export type InteractionAction = (typeof ALLOWED_ACTIONS)[number]

export function logInteraction(
  sessionId: string,
  action: InteractionAction,
  recipeId?: number,
  metadata?: Record<string, Json>,
) {
  if (sessionId.length < 8) return

  supabase
    .from('user_interactions')
    .insert({
      session_id: sessionId,
      recipe_id: recipeId ?? null,
      action,
      metadata: metadata ?? null,
    })
    .then(({ error }) => {
      if (error) console.error('[interaction-logger]', error.message)
    })
}
