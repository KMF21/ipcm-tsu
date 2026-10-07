import { createClient as create } from '@supabase/supabase-js'

/** Anonymous, cookie-free client for public data, so public pages can be cached. */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return create(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
