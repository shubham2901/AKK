const STORAGE_KEY = 'akk-last-youtube'

interface YoutubeOpenRecord {
  sessionId: string
  recipeId: number
  timestamp: number
}

export function saveYoutubeOpen(sessionId: string, recipeId: number): void {
  try {
    const record: YoutubeOpenRecord = {
      sessionId,
      recipeId,
      timestamp: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch {
    // Safari private browsing — fail silently
  }
}

export function getLastYoutubeOpen(): YoutubeOpenRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as YoutubeOpenRecord
  } catch {
    return null
  }
}

export function clearYoutubeOpen(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // no-op
  }
}
