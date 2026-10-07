import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdmissionLetter, LetterCheck } from './types'

export async function getAdmissionLetter(supabase: SupabaseClient, applicationId: string): Promise<AdmissionLetter | null> {
  if (!/^[0-9a-f-]{36}$/i.test(applicationId)) return null
  const { data, error } = await supabase.rpc('get_admission_letter', { p_app: applicationId })
  if (error) console.error('[letters] get_admission_letter', error.message)
  return (data as AdmissionLetter | null) ?? null
}

export async function checkLetter(supabase: SupabaseClient, token: string): Promise<LetterCheck | null> {
  if (!/^[0-9a-f]{32}$/.test(token)) return null
  const { data, error } = await supabase.rpc('verify_letter', { p_token: token })
  if (error) console.error('[letters] verify_letter', error.message)
  return (data as LetterCheck | null) ?? null
}
