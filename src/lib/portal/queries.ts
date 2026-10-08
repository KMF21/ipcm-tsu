import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { programmes } from '@/lib/programmes'

export type MyEnrolment = {
  id: string
  reg_no: string
  status: string
  admitted_at: string
  application_id: string
  cohort: { id: string; name: string; start_date: string; end_date: string; venue: string | null; class_group_url: string | null; materials_url: string | null; attendance_mode: 'off' | 'info' | 'required' }
  programme: (typeof programmes)[number]
}

/** The signed-in student's latest enrolment, joined with the programme catalogue. */
export async function getMyEnrolment(supabase: SupabaseClient, userId: string): Promise<MyEnrolment | null> {
  const { data } = await supabase
    .from('enrolments')
    .select('id, reg_no, status, admitted_at, application_id, cohorts(id, name, start_date, end_date, venue, class_group_url, materials_url, attendance_mode, programmes(code))')
    .eq('user_id', userId)
    .order('admitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  const c = data.cohorts as unknown as MyEnrolment['cohort'] & { programmes: { code: string } | null }
  const programme = programmes.find((p) => p.code === c.programmes?.code)
  if (!programme) return null
  return { id: data.id, reg_no: data.reg_no, status: data.status, admitted_at: data.admitted_at, application_id: data.application_id, cohort: c, programme }
}

export type SessionRow = { id: string; title: string; starts_at: string; ends_at: string; venue: string | null; online_url: string | null; modules: { number: number; title: string } | null }

export async function getCohortSessions(supabase: SupabaseClient, cohortId: string) {
  const { data } = await supabase
    .from('sessions')
    .select('id, title, starts_at, ends_at, venue, online_url, modules(number, title)')
    .eq('cohort_id', cohortId)
    .order('starts_at')
  return (data ?? []) as unknown as SessionRow[]
}

export async function getMyAttendance(supabase: SupabaseClient, enrolmentId: string) {
  const { data } = await supabase.from('attendance').select('session_id, mark').eq('enrolment_id', enrolmentId)
  return (data ?? []) as { session_id: string; mark: 'present' | 'absent' | 'excused' }[]
}

export async function getMyResult(supabase: SupabaseClient, enrolmentId: string) {
  const { data } = await supabase.from('results').select('attendance_pct, total_pct, classification, published_at').eq('enrolment_id', enrolmentId).maybeSingle()
  return data as { attendance_pct: number | null; total_pct: number | null; classification: string | null; published_at: string | null } | null
}

export async function getAnnouncements(supabase: SupabaseClient, limit = 5) {
  const { data } = await supabase.from('announcements').select('id, title, body, created_at').order('created_at', { ascending: false }).limit(limit)
  return (data ?? []) as { id: string; title: string; body: string; created_at: string }[]
}

/** Attendance so far: sessions that have ended, and the share marked present (excused counts as present). */
export function attendanceSummary(sessions: SessionRow[], marks: { session_id: string; mark: string }[]) {
  const held = sessions.filter((s) => new Date(s.ends_at) < new Date())
  const byId = new Map(marks.map((m) => [m.session_id, m.mark]))
  const attended = held.filter((s) => byId.get(s.id) === 'present' || byId.get(s.id) === 'excused').length
  return { held: held.length, attended, pct: held.length ? Math.round((attended / held.length) * 100) : null, byId }
}
