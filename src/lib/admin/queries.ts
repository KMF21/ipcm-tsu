import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { StepData } from '@/lib/application/steps'
import { LIST_TABS, type ListTab } from './status'
import { cleanSearch } from './queries-clean'

export const PAGE_SIZE = 25

export type DashboardFigures = {
  new: number
  under_review: number
  changes_requested: number
  offers_open: number
  offers_lapsed: number
  admitted: number
  in_progress: number
  oldest_waiting: string | null
  received_kobo?: number
  received_application_kobo?: number
  received_tuition_kobo?: number
  payments_count?: number
}

export async function getDashboard(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc('staff_dashboard')
  if (error) console.error('[admin] staff_dashboard', error.message)
  return (data ?? null) as DashboardFigures | null
}

export type ApplicationRow = {
  id: string
  ref: string
  status: string
  submitted_at: string | null
  created_at: string
  updated_at: string
  offer_expires_at: string | null
  application_fee_paid_at: string | null
  programmes: { code: string; short_title: string } | null
  cohorts: { name: string } | null
  profiles: { first_name: string | null; surname: string | null; email: string; phone: string | null } | null
}

const ROW_FIELDS = 'id, ref, status, submitted_at, created_at, updated_at, offer_expires_at, application_fee_paid_at, cohorts(name)'

export { cleanSearch }

export async function listApplications(
  supabase: SupabaseClient,
  opts: { tab?: ListTab; q?: string; programme?: string; cohort?: string; page?: number },
) {
  const tab = LIST_TABS.find((t) => t.key === opts.tab) ?? LIST_TABS[0]
  const q = cleanSearch(opts.q)
  const byRef = /^app-/i.test(q)
  const searchPeople = q && !byRef
  let query = supabase
    .from('applications')
    .select(`${ROW_FIELDS}, programmes${opts.programme ? '!inner' : ''}(code, short_title), profiles${searchPeople ? '!inner' : ''}(first_name, surname, email, phone)`, { count: 'exact' })
  if (tab.statuses.length) query = query.in('status', tab.statuses as unknown as string[])
  if (byRef) query = query.ilike('ref', `%${q}%`)
  if (searchPeople) {
    const words = q.split(' ').slice(0, 3)
    for (const w of words) {
      query = query.or(`first_name.ilike.%${w}%,surname.ilike.%${w}%,other_names.ilike.%${w}%,email.ilike.%${w}%,phone.ilike.%${w}%`, { referencedTable: 'profiles' })
    }
  }
  if (opts.programme) query = query.eq('programmes.code', opts.programme)
  if (opts.cohort) query = query.eq('cohort_id', opts.cohort)
  query = tab.key === 'review'
    ? query.order('submitted_at', { ascending: true, nullsFirst: false })
    : query.order('updated_at', { ascending: false })
  const page = Math.max(1, opts.page ?? 1)
  query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  const { data, count, error } = await query
  if (error) console.error('[admin] listApplications', error.message)
  return { rows: (data ?? []) as unknown as ApplicationRow[], count: count ?? 0, page }
}

export async function getFilterOptions(supabase: SupabaseClient) {
  const [{ data: programmes }, { data: cohorts }] = await Promise.all([
    supabase.from('programmes').select('code, short_title').order('code'),
    supabase.from('cohorts').select('id, name, start_date, programmes(code)').order('start_date', { ascending: false }),
  ])
  return {
    programmes: (programmes ?? []) as { code: string; short_title: string }[],
    cohorts: ((cohorts ?? []) as unknown as { id: string; name: string; start_date: string; programmes: { code: string } | null }[]),
  }
}

export type ApplicationDetail = {
  id: string
  ref: string
  status: string
  step_data: StepData
  statement: string | null
  is_mature_entry: boolean
  submitted_at: string | null
  offered_at: string | null
  offer_expires_at: string | null
  decision_reason: string | null
  application_fee_paid_at: string | null
  created_at: string
  user_id: string
  programmes: { code: string; title: string; short_title: string } | null
  cohorts: { id: string; name: string; start_date: string; capacity: number; offer_expiry_days: number } | null
  profiles: {
    title: string | null; first_name: string | null; other_names: string | null; surname: string | null
    email: string; phone: string | null; sex: string | null; dob: string | null; address: string | null
    organisation: string | null; job_role: string | null; lgas: { name: string; states: { name: string } | null } | null
  } | null
  documents: { id: string; type: string; storage_path: string; mime: string; size_bytes: number; status: 'pending' | 'approved' | 'rejected'; rejection_reason: string | null; reviewed_at: string | null; created_at: string }[]
  emails?: { id: number; kind: string; subject: string; status: 'sending' | 'sent' | 'failed' | 'skipped'; created_at: string }[]
  application_status_history: { id: number; from_status: string | null; to_status: string; note: string | null; created_at: string; profiles: { first_name: string | null; surname: string | null; role: string } | null }[]
}

export async function getApplicationDetail(supabase: SupabaseClient, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const { data, error } = await supabase
    .from('applications')
    .select(`id, ref, status, step_data, statement, is_mature_entry, submitted_at, offered_at, offer_expires_at, decision_reason, application_fee_paid_at, created_at, user_id,
      programmes(code, title, short_title),
      cohorts(id, name, start_date, capacity, offer_expiry_days),
      profiles(title, first_name, other_names, surname, email, phone, sex, dob, address, organisation, job_role, lgas(name, states(name))),
      documents(id, type, storage_path, mime, size_bytes, status, rejection_reason, reviewed_at, created_at),
      application_status_history(id, from_status, to_status, note, created_at, profiles(first_name, surname, role))`)
    .eq('id', id)
    .order('created_at', { referencedTable: 'documents', ascending: true })
    .order('created_at', { referencedTable: 'application_status_history', ascending: false })
    .maybeSingle()
  if (error) console.error('[admin] getApplicationDetail', error.message)
  if (!data) return null
  const app = data as unknown as ApplicationDetail
  const { data: emails } = await supabase.from('email_log').select('id, kind, subject, status, created_at').eq('application_id', id).order('created_at', { ascending: false }).limit(20)
  app.emails = (emails ?? []) as ApplicationDetail['emails']
  // Short-lived private links so staff can open each file.
  const paths = app.documents.map((d) => d.storage_path)
  const links: Record<string, string> = {}
  if (paths.length) {
    const { data: signed } = await supabase.storage.from('applicant-documents').createSignedUrls(paths, 60 * 15)
    for (const s of signed ?? []) if (s.path && s.signedUrl) links[s.path] = s.signedUrl
  }
  return { app, links }
}

export type PaymentListRow = {
  id: string
  receipt_no: string | null
  reference: string
  status: string
  amount_kobo: number
  paid_at: string | null
  created_at: string
  fee_items: { type: 'application' | 'acceptance' | 'tuition'; programmes: { code: string } | null } | null
  profiles: { first_name: string | null; surname: string | null; email: string } | null
  applications: { id: string; ref: string } | null
}

export async function listPayments(supabase: SupabaseClient, opts: { q?: string; type?: string; status?: string; page?: number }) {
  const q = cleanSearch(opts.q)
  const searchPeople = q && !/^(rct|ipcm|app)-/i.test(q)
  let query = supabase
    .from('payments')
    .select(`id, receipt_no, reference, status, amount_kobo, paid_at, created_at, fee_items!inner(type, programmes(code)), profiles!payments_user_id_fkey${searchPeople ? '!inner' : ''}(first_name, surname, email), applications(id, ref)`, { count: 'exact' })
  if (opts.status !== 'all') query = query.eq('status', opts.status === 'pending' || opts.status === 'failed' ? opts.status : 'paid')
  if (opts.type === 'application' || opts.type === 'tuition') query = query.eq('fee_items.type', opts.type)
  if (q && /^rct-/i.test(q)) query = query.ilike('receipt_no', `%${q}%`)
  else if (q && /^ipcm-/i.test(q)) query = query.ilike('reference', `%${q}%`)
  else if (searchPeople) {
    for (const w of q.split(' ').slice(0, 3)) {
      query = query.or(`first_name.ilike.%${w}%,surname.ilike.%${w}%,email.ilike.%${w}%`, { referencedTable: 'profiles' })
    }
  }
  const page = Math.max(1, opts.page ?? 1)
  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  if (error) console.error('[admin] listPayments', error.message)
  return { rows: (data ?? []) as unknown as PaymentListRow[], count: count ?? 0, page }
}

export type CohortRow = {
  id: string
  name: string
  start_date: string
  end_date: string
  application_deadline: string
  capacity: number
  offer_expiry_days: number
  venue: string | null
  status: 'draft' | 'open' | 'closed' | 'running' | 'completed'
  accept_late: boolean
  attendance_mode: 'off' | 'info' | 'required'
  min_attendance_pct: number | null
  programme_id: string
  programmes: { code: string; short_title: string } | null
  seats?: { admitted: number; offers_open: number; under_review: number; seats_taken: number }
}

export async function listCohorts(supabase: SupabaseClient) {
  const [{ data }, { data: seats }] = await Promise.all([
    supabase.from('cohorts').select('id, name, start_date, end_date, application_deadline, capacity, offer_expiry_days, venue, status, accept_late, attendance_mode, min_attendance_pct, programme_id, programmes(code, short_title)').order('start_date', { ascending: false }),
    supabase.rpc('staff_intake_seats'),
  ])
  const byId = new Map((seats ?? []).map((s: { cohort_id: string }) => [s.cohort_id, s]))
  return ((data ?? []) as unknown as CohortRow[]).map((c) => ({ ...c, seats: byId.get(c.id) as CohortRow['seats'] }))
}

export type FeeRow = { id: string; type: 'application' | 'acceptance' | 'tuition'; base_amount_kobo: number; processing_fee_kobo: number; active: boolean; updated_at: string; programmes: { code: string; short_title: string } | null }

export async function listFees(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('fee_items')
    .select('id, type, base_amount_kobo, processing_fee_kobo, active, updated_at, programmes(code, short_title)')
    .in('type', ['application', 'tuition'])
  return ((data ?? []) as unknown as FeeRow[]).sort((a, b) => (a.programmes?.code ?? '').localeCompare(b.programmes?.code ?? '') || a.type.localeCompare(b.type))
}

export type PersonRow = {
  id: string
  first_name: string | null
  surname: string | null
  other_names: string | null
  email: string
  phone: string | null
  role: string
  created_at: string
  applications: { id: string; ref: string; status: string; programmes: { code: string } | null }[]
}

/** Applicant and student accounts only: staff accounts never appear in the help search. */
export async function findPeople(supabase: SupabaseClient, raw: string) {
  const q = cleanSearch(raw)
  if (q.length < 2) return []
  let query = supabase
    .from('profiles')
    .select('id, first_name, surname, other_names, email, phone, role, created_at, applications(id, ref, status, programmes(code))')
    .in('role', ['applicant', 'student'])
  if (/^app-/i.test(q)) {
    const { data: a } = await supabase.from('applications').select('user_id').ilike('ref', `%${q}%`).limit(10)
    const ids = (a ?? []).map((x) => x.user_id)
    if (!ids.length) return []
    query = query.in('id', ids)
  } else {
    for (const w of q.split(' ').slice(0, 3)) query = query.or(`first_name.ilike.%${w}%,surname.ilike.%${w}%,other_names.ilike.%${w}%,email.ilike.%${w}%,phone.ilike.%${w}%`)
  }
  const { data, error } = await query.order('created_at', { ascending: false }).limit(20)
  if (error) console.error('[admin] findPeople', error.message)
  return (data ?? []) as unknown as PersonRow[]
}
