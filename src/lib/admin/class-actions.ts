'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { z } from 'zod'
import { requireStaff } from './session'
import { can } from './roles'
import { canSeeClass } from './classes'
import type { ActionState } from './actions'
import { notifyClass } from '@/lib/email/notify'
import { siteUrl } from '@/lib/site-url'

const path = (id: string) => `/admin/classes/${id}`
const uuid = z.string().uuid()

async function forClass(cohortId: string, directorOnly = false) {
  const ctx = await requireStaff(directorOnly ? can.runClasses : can.classes)
  if (!uuid.safeParse(cohortId).success || !(await canSeeClass(ctx.supabase, ctx.staff, cohortId))) throw new Error('Not allowed')
  return ctx
}

function fail(e: unknown): ActionState {
  const m = e instanceof Error ? e.message : String(e)
  console.error('[classes]', m)
  return { error: /Only|between|published|Choose|not found|allowed/i.test(m) ? m.replace(/^.*?ERROR:\s*/, '') : 'Something went wrong. Please try again.' }
}

/* ---------- Settings ---------- */
const settings = z.object({
  attendance_mode: z.enum(['off', 'info', 'required']),
  min_attendance_pct: z.string().optional().transform((v) => (v ? Number(v) : null)).refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 100), 'Minimum attendance must be 0–100'),
  class_group_url: z.string().trim().optional().transform((v) => v || null).refine((v) => !v || /^https:\/\//.test(v), 'Links must start with https://'),
  materials_url: z.string().trim().optional().transform((v) => v || null).refine((v) => !v || /^https:\/\//.test(v), 'Links must start with https://'),
}).refine((v) => v.attendance_mode !== 'required' || v.min_attendance_pct !== null, { message: 'Set the minimum attendance, or choose another attendance option' })

export async function saveClassSettings(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get('cohort_id'))
  try {
    const { supabase } = await forClass(id, true)
    const parsed = settings.safeParse(Object.fromEntries(fd))
    if (!parsed.success) return { error: parsed.error.issues[0]?.message }
    const { error } = await supabase.from('cohorts').update(parsed.data).eq('id', id)
    if (error) throw error
    revalidatePath(path(id))
    return { ok: true, message: 'Class settings saved.' }
  } catch (e) { return fail(e) }
}

export async function setFacilitator(fd: FormData) {
  const id = String(fd.get('cohort_id'))
  const { supabase } = await forClass(id, true)
  const user = String(fd.get('user_id'))
  if (!uuid.safeParse(user).success) return
  if (fd.get('op') === 'remove') await supabase.from('cohort_facilitators').delete().eq('cohort_id', id).eq('user_id', user)
  else await supabase.from('cohort_facilitators').upsert({ cohort_id: id, user_id: user })
  revalidatePath(path(id))
}

/* ---------- Timetable ---------- */
const session = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  title: z.string().trim().min(3, 'Give the session a title').max(160),
  module_id: z.string().uuid().optional().or(z.literal('')),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date'),
  start: z.string().regex(/^\d{2}:\d{2}$/, 'Choose a start time'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'Choose an end time'),
  venue: z.string().trim().max(160).optional(),
}).refine((v) => v.end > v.start, { message: 'The end time must be after the start time' })

export async function saveSession(_: ActionState, fd: FormData): Promise<ActionState> {
  const cohort = String(fd.get('cohort_id'))
  try {
    const { supabase } = await forClass(cohort, true)
    const parsed = session.safeParse(Object.fromEntries(fd))
    if (!parsed.success) return { error: parsed.error.issues[0]?.message }
    const v = parsed.data
    const row = {
      cohort_id: cohort, title: v.title, module_id: v.module_id || null, venue: v.venue || null,
      starts_at: new Date(`${v.date}T${v.start}:00+01:00`).toISOString(), ends_at: new Date(`${v.date}T${v.end}:00+01:00`).toISOString(),
    }
    const { error } = v.id ? await supabase.from('sessions').update(row).eq('id', v.id) : await supabase.from('sessions').insert(row)
    if (error) throw error
    revalidatePath(path(cohort))
    return { ok: true, message: v.id ? 'Session updated.' : 'Session added to the timetable.' }
  } catch (e) { return fail(e) }
}

export async function deleteSession(fd: FormData) {
  const cohort = String(fd.get('cohort_id'))
  const { supabase } = await forClass(cohort, true)
  await supabase.from('sessions').delete().eq('id', String(fd.get('id'))).eq('cohort_id', cohort)
  revalidatePath(path(cohort))
}

/* ---------- Attendance ---------- */
export async function saveAttendance(_: ActionState, fd: FormData): Promise<ActionState> {
  const cohort = String(fd.get('cohort_id'))
  const sessionId = String(fd.get('session_id'))
  try {
    const { supabase, staff } = await forClass(cohort)
    const rows: { session_id: string; enrolment_id: string; mark: string; marked_by: string; marked_at: string }[] = []
    for (const [k, v] of fd.entries()) {
      if (!k.startsWith('mark:') || typeof v !== 'string' || !['present', 'absent', 'excused'].includes(v)) continue
      rows.push({ session_id: sessionId, enrolment_id: k.slice(5), mark: v, marked_by: staff.id, marked_at: new Date().toISOString() })
    }
    if (!rows.length) return { error: 'Mark at least one student.' }
    const { error } = await supabase.from('attendance').upsert(rows)
    if (error) throw error
    revalidatePath(path(cohort))
    return { ok: true, message: `Attendance saved for ${rows.length} student${rows.length === 1 ? '' : 's'}.` }
  } catch (e) { return fail(e) }
}

/* ---------- Scores ---------- */
export async function saveStudentScores(_: ActionState, fd: FormData): Promise<ActionState> {
  const cohort = String(fd.get('cohort_id'))
  const enrolment = String(fd.get('enrolment_id'))
  try {
    const { supabase } = await forClass(cohort)
    const num = (v: FormDataEntryValue | null) => {
      const s = String(v ?? '').trim()
      if (s === '') return null
      const n = Number(s)
      if (!Number.isFinite(n) || n < 0 || n > 100) throw new Error('Scores must be between 0 and 100')
      return n
    }
    for (const [k, v] of fd.entries()) {
      if (k.startsWith('module:')) {
        const { error } = await supabase.rpc('save_score', { p_enrolment: enrolment, p_component: 'module', p_module: k.slice(7), p_score: num(v) })
        if (error) throw error
      }
    }
    const { error } = await supabase.rpc('save_score', { p_enrolment: enrolment, p_component: 'capstone', p_module: null, p_score: num(fd.get('capstone')) })
    if (error) throw error
    revalidatePath(path(cohort))
    return { ok: true, message: 'Saved' }
  } catch (e) { return fail(e) }
}

/* ---------- Results ---------- */
export async function computeResults(_: ActionState, fd: FormData): Promise<ActionState> {
  const cohort = String(fd.get('cohort_id'))
  try {
    const { supabase } = await forClass(cohort, true)
    const { data, error } = await supabase.rpc('staff_compute_results', { p_cohort: cohort })
    if (error) throw error
    revalidatePath(path(cohort))
    return { ok: true, message: `Results calculated for ${data} student${data === 1 ? '' : 's'}. Check them, then publish.` }
  } catch (e) { return fail(e) }
}

export async function publishResults(_: ActionState, fd: FormData): Promise<ActionState> {
  const cohort = String(fd.get('cohort_id'))
  const publish = fd.get('publish') === 'yes'
  try {
    const { supabase } = await forClass(cohort, true)
    const { error } = await supabase.rpc('staff_publish_results', { p_cohort: cohort, p_publish: publish })
    if (error) throw error
    if (publish) {
      const baseUrl = await siteUrl()
      after(() => notifyClass({ baseUrl }, cohort, { kind: 'results' }))
    }
    revalidatePath(path(cohort))
    return { ok: true, message: publish ? 'Results published. Students can see them and are being emailed.' : 'Results hidden from students. Scores can be changed again.' }
  } catch (e) { return fail(e) }
}

export async function setWaiver(fd: FormData) {
  const cohort = String(fd.get('cohort_id'))
  const { supabase } = await forClass(cohort, true)
  await supabase.rpc('staff_set_attendance_waiver', { p_enrolment: String(fd.get('enrolment_id')), p_waived: fd.get('waived') === 'yes' })
  revalidatePath(path(cohort))
}

/* ---------- Announcements ---------- */
export async function postAnnouncement(_: ActionState, fd: FormData): Promise<ActionState> {
  const cohort = String(fd.get('cohort_id'))
  try {
    const { supabase, staff } = await forClass(cohort)
    const title = String(fd.get('title') ?? '').trim()
    const body = String(fd.get('body') ?? '').trim()
    if (title.length < 3) return { error: 'Add a short title.' }
    if (body.length < 5) return { error: 'Write the announcement.' }
    // Cohort only (no programme), so other intakes of the same programme don't see it.
    const { error } = await supabase.from('announcements').insert({ title: title.slice(0, 160), body: body.slice(0, 3000), cohort_id: cohort, created_by: staff.id })
    if (error) throw error
    if (fd.get('email') === 'on') {
      const baseUrl = await siteUrl()
      after(() => notifyClass({ baseUrl }, cohort, { kind: 'announcement', title, body }))
    }
    revalidatePath(path(cohort))
    return { ok: true, message: fd.get('email') === 'on' ? 'Posted. Students see it on their dashboard and are being emailed.' : 'Posted on the students’ dashboard.' }
  } catch (e) { return fail(e) }
}

export async function deleteAnnouncement(fd: FormData) {
  const cohort = String(fd.get('cohort_id'))
  const { supabase } = await forClass(cohort)
  await supabase.from('announcements').delete().eq('id', String(fd.get('id')))
  revalidatePath(path(cohort))
}
