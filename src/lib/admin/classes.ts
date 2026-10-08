import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Role } from './roles'
import { can } from './roles'

export type ClassSummary = {
  id: string; name: string; start_date: string; end_date: string; status: string
  programmes: { code: string; short_title: string } | null
  students: number; sessions: number; published: number
}

/** Intakes with admitted students. Facilitators only see the intakes they are assigned to. */
export async function listClasses(supabase: SupabaseClient, staff: { id: string; role: Role }): Promise<ClassSummary[]> {
  let ids: string[] | null = null
  if (!can.runClasses(staff.role)) {
    const { data } = await supabase.from('cohort_facilitators').select('cohort_id').eq('user_id', staff.id)
    ids = (data ?? []).map((r) => r.cohort_id)
    if (!ids.length) return []
  }
  let q = supabase
    .from('cohorts')
    .select('id, name, start_date, end_date, status, programmes(code, short_title), enrolments(count), sessions(count)')
    .in('status', ['open', 'closed', 'running', 'completed'])
    .order('start_date', { ascending: false })
  if (ids) q = q.in('id', ids)
  const { data } = await q
  const rows = (data ?? []) as unknown as (Omit<ClassSummary, 'students' | 'sessions' | 'published'> & { enrolments: { count: number }[]; sessions: { count: number }[] })[]
  const withStudents = rows.filter((r) => (r.enrolments[0]?.count ?? 0) > 0 || ids)
  const { data: pub } = await supabase.from('results').select('enrolment_id, published_at, enrolments!inner(cohort_id)').not('published_at', 'is', null)
  const pubBy = new Map<string, number>()
  for (const r of (pub ?? []) as unknown as { enrolments: { cohort_id: string } }[]) pubBy.set(r.enrolments.cohort_id, (pubBy.get(r.enrolments.cohort_id) ?? 0) + 1)
  return withStudents.map((r) => ({ ...r, students: r.enrolments[0]?.count ?? 0, sessions: r.sessions[0]?.count ?? 0, published: pubBy.get(r.id) ?? 0 }))
}

export type ClassStudent = { id: string; reg_no: string; status: string; attendance_waived: boolean; name: string; email: string; phone: string | null }
export type ClassSession = { id: string; title: string; starts_at: string; ends_at: string; venue: string | null; module_id: string | null; facilitator_id: string | null }
export type ClassModule = { id: string; number: number; title: string }
export type ClassDetail = {
  cohort: { id: string; name: string; start_date: string; end_date: string; venue: string | null; status: string; attendance_mode: 'off' | 'info' | 'required'; min_attendance_pct: number | null; class_group_url: string | null; materials_url: string | null; programme_id: string; programmes: { code: string; short_title: string } | null }
  modules: ClassModule[]
  students: ClassStudent[]
  sessions: ClassSession[]
  attendance: { session_id: string; enrolment_id: string; mark: 'present' | 'absent' | 'excused' }[]
  scores: { enrolment_id: string; component: string; module_id: string | null; score: number }[]
  results: { enrolment_id: string; attendance_pct: number | null; total_pct: number | null; classification: string | null; published_at: string | null }[]
  facilitators: { user_id: string; name: string; email: string }[]
  announcements: { id: string; title: string; body: string; created_at: string }[]
}

export async function canSeeClass(supabase: SupabaseClient, staff: { id: string; role: Role }, cohortId: string) {
  if (can.runClasses(staff.role)) return true
  const { data } = await supabase.from('cohort_facilitators').select('user_id').eq('cohort_id', cohortId).eq('user_id', staff.id).maybeSingle()
  return !!data
}

export async function getClass(supabase: SupabaseClient, cohortId: string): Promise<ClassDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(cohortId)) return null
  const { data: cohort } = await supabase
    .from('cohorts')
    .select('id, name, start_date, end_date, venue, status, attendance_mode, min_attendance_pct, class_group_url, materials_url, programme_id, programmes(code, short_title)')
    .eq('id', cohortId)
    .maybeSingle()
  if (!cohort) return null
  const [mods, enr, sess, facs, ann] = await Promise.all([
    supabase.from('modules').select('id, number, title').eq('programme_id', cohort.programme_id).order('number'),
    supabase.from('enrolments').select('id, reg_no, status, attendance_waived, profiles!enrolments_user_id_fkey(first_name, other_names, surname, title, email, phone)').eq('cohort_id', cohortId).order('reg_no'),
    supabase.from('sessions').select('id, title, starts_at, ends_at, venue, module_id, facilitator_id').eq('cohort_id', cohortId).order('starts_at'),
    supabase.from('cohort_facilitators').select('user_id, profiles(first_name, surname, email)').eq('cohort_id', cohortId),
    supabase.from('announcements').select('id, title, body, created_at').eq('cohort_id', cohortId).order('created_at', { ascending: false }),
  ])
  type P = { first_name: string | null; other_names: string | null; surname: string | null; title: string | null; email: string; phone: string | null }
  const students: ClassStudent[] = ((enr.data ?? []) as unknown as { id: string; reg_no: string; status: string; attendance_waived: boolean; profiles: P | null }[]).map((e) => ({
    id: e.id, reg_no: e.reg_no, status: e.status, attendance_waived: e.attendance_waived,
    name: [e.profiles?.title, e.profiles?.first_name, e.profiles?.other_names, e.profiles?.surname].filter(Boolean).join(' ') || e.profiles?.email || '—',
    email: e.profiles?.email ?? '', phone: e.profiles?.phone ?? null,
  }))
  const ids = students.map((s) => s.id)
  const [att, sc, res] = ids.length
    ? await Promise.all([
        supabase.from('attendance').select('session_id, enrolment_id, mark').in('enrolment_id', ids),
        supabase.from('assessment_scores').select('enrolment_id, component, module_id, score').in('enrolment_id', ids),
        supabase.from('results').select('enrolment_id, attendance_pct, total_pct, classification, published_at').in('enrolment_id', ids),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]
  return {
    cohort: cohort as unknown as ClassDetail['cohort'],
    modules: (mods.data ?? []) as ClassModule[],
    students,
    sessions: (sess.data ?? []) as ClassSession[],
    attendance: (att.data ?? []) as ClassDetail['attendance'],
    scores: ((sc.data ?? []) as { enrolment_id: string; component: string; module_id: string | null; score: number }[]).map((x) => ({ ...x, score: Number(x.score) })),
    results: (res.data ?? []) as ClassDetail['results'],
    facilitators: ((facs.data ?? []) as unknown as { user_id: string; profiles: { first_name: string | null; surname: string | null; email: string } | null }[]).map((f) => ({ user_id: f.user_id, name: [f.profiles?.first_name, f.profiles?.surname].filter(Boolean).join(' ') || f.profiles?.email || '—', email: f.profiles?.email ?? '' })),
    announcements: (ann.data ?? []) as ClassDetail['announcements'],
  }
}
