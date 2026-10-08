import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Certificate, CertificateCheck, Statement } from './types'

const UUID = /^[0-9a-f-]{36}$/i

/** Full certificate data for PDFs. Server only (service role); callers check permission first. */
export async function loadCertificates(ids: string[]): Promise<Certificate[]> {
  const admin = createAdminClient()
  const out: Certificate[] = []
  for (const id of ids) {
    const { data, error } = await admin.rpc('certificate_json', { p_cert: id })
    if (error) console.error('[certificates] certificate_json', error.message)
    const c = data as Certificate | null
    if (c && !c.revoked) out.push(c)
  }
  return out.sort((a, b) => a.certificate_no.localeCompare(b.certificate_no))
}

export async function getStatement(supabase: SupabaseClient, enrolmentId: string): Promise<Statement | null> {
  if (!UUID.test(enrolmentId)) return null
  const { data, error } = await supabase.rpc('get_statement', { p_enrolment: enrolmentId })
  if (error) console.error('[certificates] get_statement', error.message)
  return (data as Statement | null) ?? null
}

/** Public QR check, plus a short-lived link to the passport photo on record. */
export async function checkCertificate(supabase: SupabaseClient, token: string): Promise<{ r: CertificateCheck | null; photoUrl: string | null }> {
  if (!/^[0-9a-f]{32}$/.test(token)) return { r: null, photoUrl: null }
  const { data, error } = await supabase.rpc('verify_certificate_token', { p_token: token })
  if (error) console.error('[certificates] verify_certificate_token', error.message)
  const r = (data as CertificateCheck | null) ?? null
  let photoUrl: string | null = null
  if (r?.valid && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient()
      const { data: c } = await admin.from('certificates').select('photo_path').eq('verify_hash', token).maybeSingle()
      if (c?.photo_path) {
        const { data: s } = await admin.storage.from('applicant-documents').createSignedUrl(c.photo_path, 600)
        photoUrl = s?.signedUrl ?? null
      }
    } catch (e) {
      console.error('[certificates] photo', e)
    }
  }
  return { r, photoUrl }
}

export type CertRow = {
  id: string
  enrolment_id: string
  certificate_no: string
  issued_at: string
  classification: string | null
  revoked_at: string | null
  revoke_reason: string | null
  print_count: number
  last_printed_at: string | null
  collected_at: string | null
  collected_by: string | null
  collection_note: string | null
}

/** Every certificate (valid and revoked) for an intake. Director only (RLS). */
export async function listCohortCertificates(supabase: SupabaseClient, cohortId: string): Promise<CertRow[]> {
  const { data, error } = await supabase
    .from('certificates')
    .select('id, enrolment_id, certificate_no, issued_at, classification, revoked_at, revoke_reason, print_count, last_printed_at, collected_at, collected_by, collection_note, enrolments!inner(cohort_id)')
    .eq('enrolments.cohort_id', cohortId)
    .order('issued_at')
  if (error) console.error('[certificates] list', error.message)
  return ((data ?? []) as unknown as (CertRow & { enrolments: unknown })[]).map(({ enrolments: _e, ...c }) => c)
}
