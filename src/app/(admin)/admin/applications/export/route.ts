import type { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/admin/session'
import { can } from '@/lib/admin/roles'
import { LIST_TABS, appStatus, lastPayDay } from '@/lib/admin/status'
import { cleanSearch } from '@/lib/admin/queries-clean'
import { csvResponse, toCsv } from '@/lib/admin/csv'
import type { StepData } from '@/lib/application/steps'

export async function GET(req: NextRequest) {
  const { supabase } = await requireStaff(can.review)
  const sp = req.nextUrl.searchParams
  const tab = LIST_TABS.find((t) => t.key === sp.get('tab')) ?? LIST_TABS[LIST_TABS.length - 1]
  const programme = sp.get('programme')
  let q = supabase
    .from('applications')
    .select(`ref, status, step_data, submitted_at, application_fee_paid_at, offer_expires_at, created_at,
      programmes${programme ? '!inner' : ''}(code), cohorts(name),
      profiles(title, first_name, other_names, surname, email, phone, sex, dob, organisation, job_role, lgas(name, states(name))),
      enrolments(reg_no)`)
    .order('created_at', { ascending: false })
    .limit(5000)
  if (tab.statuses.length) q = q.in('status', tab.statuses as unknown as string[])
  if (programme) q = q.eq('programmes.code', programme)
  if (sp.get('cohort')) q = q.eq('cohort_id', sp.get('cohort')!)
  const term = cleanSearch(sp.get('q') ?? '')
  if (/^app-/i.test(term)) q = q.ilike('ref', `%${term}%`)
  const { data } = await q
  type Row = {
    ref: string; status: string; step_data: StepData; submitted_at: string | null; application_fee_paid_at: string | null; offer_expires_at: string | null; created_at: string
    programmes: { code: string } | null; cohorts: { name: string } | null
    profiles: { title: string | null; first_name: string | null; other_names: string | null; surname: string | null; email: string; phone: string | null; sex: string | null; dob: string | null; organisation: string | null; job_role: string | null; lgas: { name: string; states: { name: string } | null } | null } | null
    enrolments: { reg_no: string }[] | { reg_no: string } | null
  }
  const d = (iso?: string | null) => (iso ? iso.slice(0, 10) : '')
  const rows = ((data ?? []) as unknown as Row[]).map((a) => {
    const p = a.profiles
    const reg = Array.isArray(a.enrolments) ? a.enrolments[0]?.reg_no : a.enrolments?.reg_no
    return [
      a.ref, appStatus(a.status, a.offer_expires_at).label,
      [p?.title, p?.first_name, p?.other_names, p?.surname].filter(Boolean).join(' '), p?.email, p?.phone, p?.sex, d(p?.dob),
      p?.lgas?.states?.name, p?.lgas?.name, a.programmes?.code, a.cohorts?.name,
      a.step_data?.sponsorship?.sponsored === 'yes' ? a.step_data.sponsorship.sponsor_organisation : 'Self',
      p?.organisation, p?.job_role, a.step_data?.qualifications?.highest_qualification,
      d(a.created_at), d(a.submitted_at), d(a.application_fee_paid_at), a.offer_expires_at ? lastPayDay(a.offer_expires_at) : '', reg,
    ]
  })
  return csvResponse('ipcm-applications', toCsv(
    ['Application number', 'Status', 'Name', 'Email', 'Phone', 'Sex', 'Date of birth', 'State', 'LGA', 'Programme', 'Intake', 'Paid by', 'Organisation', 'Role', 'Highest qualification', 'Started', 'Submitted', 'Application fee paid', 'Offer pay-by', 'Registration number'],
    rows,
  ))
}
