import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

let _client: SupabaseClient<Database> | null = null

function getClient(): SupabaseClient<Database> {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add both in Vercel: Project → Settings → Environment Variables (and redeploy).',
    )
  }
  _client = createClient<Database>(url, key)
  return _client
}

/**
 * Lazy singleton so the module can load during `next build` / prerender when env
 * is only available at runtime (e.g. missing vars in CI). First real use still requires both vars.
 */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    const client = getClient()
    const value = Reflect.get(client, prop as keyof SupabaseClient<Database>) as unknown
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(client)
    }
    return value
  },
})
