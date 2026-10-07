import type { SupabaseClient } from '@supabase/supabase-js'

export type MyApplication = {
  id: string
  ref: string
  status: string
  application_fee_paid_at: string | null
  offer_expires_at: string | null
  decision_reason: string | null
  step_data: unknown
  cohort_id: string
  programme_id: string
  created_at: string
  programmes: { code: string; title: string; short_title: string } | null
  cohorts: { name: string; start_date: string; application_deadline: string } | null
}

/** The applicant's most recent application (one active application per person). */
export async function getMyApplication(supabase: SupabaseClient, userId: string): Promise<MyApplication | null> {
  const { data } = await supabase
    .from('applications')
    .select('id, ref, status, application_fee_paid_at, offer_expires_at, decision_reason, step_data, cohort_id, programme_id, created_at, programmes(code, title, short_title), cohorts(name, start_date, application_deadline)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as unknown as MyApplication) ?? null
}

export type OpenCohort = { id: string; name: string; start_date: string; end_date: string; application_deadline: string; capacity: number; programme_code: string }

export async function getOpenCohorts(supabase: SupabaseClient): Promise<OpenCohort[]> {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('cohorts')
    .select('id, name, start_date, end_date, application_deadline, capacity, programmes!inner(code)')
    .eq('status', 'open')
    .gte('application_deadline', today)
    .order('start_date')
  return (data ?? []).map((c) => ({ ...c, programme_code: (c.programmes as unknown as { code: string }).code })) as OpenCohort[]
}

export type StateWithLgas = { id: number; name: string; lgas: { id: number; name: string }[] }

export async function getStatesWithLgas(supabase: SupabaseClient): Promise<StateWithLgas[]> {
  const [{ data: states }, { data: lgas }] = await Promise.all([
    supabase.from('states').select('id, name').order('name'),
    supabase.from('lgas').select('id, name, state_id').order('name').range(0, 999),
  ])
  return (states ?? []).map((s) => ({ ...s, lgas: (lgas ?? []).filter((l) => l.state_id === s.id).map(({ id, name }) => ({ id, name })) }))
}

export type MyDocument = { id: string; type: string; mime: string; size_bytes: number; status: string; rejection_reason: string | null; created_at: string; storage_path: string }

export async function getMyDocuments(supabase: SupabaseClient, applicationId: string): Promise<MyDocument[]> {
  const { data } = await supabase
    .from('documents')
    .select('id, type, mime, size_bytes, status, rejection_reason, created_at, storage_path')
    .eq('application_id', applicationId)
    .order('created_at')
  return (data ?? []) as MyDocument[]
}
