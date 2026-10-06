import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Service-role client. SERVER ONLY: Paystack webhook, number generation, PDF generation.
 * Bypasses RLS — never import from a Client Component.
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
