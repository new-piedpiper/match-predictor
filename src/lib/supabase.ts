import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY

export const supabaseConfigured = Boolean(url && key)

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!url || !key) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY')
  }
  if (!client) client = createClient(url, key)
  return client
}
