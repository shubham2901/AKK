'use client'

import { useEffect, useRef } from 'react'
import { useSessionStore } from '@/stores/session-store'
import { logInteraction } from '@/services/interaction-logger'
import { syncSession } from '@/services/session-sync'
import { getLastYoutubeOpen, clearYoutubeOpen } from '@/lib/utils/youtube-tracker'

const TWO_HOURS = 2 * 60 * 60 * 1000
const FOUR_HOURS = 4 * 60 * 60 * 1000
const DEBOUNCE_MS = 1000

export function useSessionLifecycle() {
  const lastCheckRef = useRef(0)

  useEffect(() => {
    function runLifecycleCheck() {
      const now = Date.now()
      if (now - lastCheckRef.current < DEBOUNCE_MS) return
      lastCheckRef.current = now

      const state = useSessionStore.getState()

      // 1. Success inference (before timeout — uses old sessionId)
      const ytRecord = getLastYoutubeOpen()
      if (ytRecord && now - ytRecord.timestamp > TWO_HOURS) {
        logInteraction(ytRecord.sessionId, 'session_success_inferred', ytRecord.recipeId)
        clearYoutubeOpen()
      }

      // 2. Session timeout check
      if (now - state.session.lastActiveAt > FOUR_HOURS) {
        const newId = state.rotateSession()
        const s = useSessionStore.getState()
        syncSession(
          newId,
          s.preferences.diet,
          s.preferences.blocklist,
          s.session.cuisineFilter,
          s.session.mealTypeFilter,
          s.session.ingredientFilter,
        )
        return // rotateSession already touched lastActiveAt
      }

      // 3. Touch activity
      state.touchActivity()
    }

    // Run on mount
    runLifecycleCheck()

    // Listen for tab visibility and window focus
    function onVisibility() {
      if (document.visibilityState === 'visible') runLifecycleCheck()
    }
    function onFocus() {
      runLifecycleCheck()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
    }
  }, [])
}
