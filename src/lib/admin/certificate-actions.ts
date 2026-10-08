'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { z } from 'zod'
import { requireStaff } from './session'
import { can } from './roles'
import type { ActionState } from './actions'
import { notifyCertificatesIssued, notifyDirectorOfCertificates } from '@/lib/email/notify'
import { siteUrl } from '@/lib/site-url'

const uuid = z.string().uuid()
const path = (cohort: string) => `/admin/classes/${cohort}`

function fail(e: unknown): ActionState {
  const m = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : String(e)
  console.error('[certificates]', m)
  return { error: /Only|Not allowed|reason|not found|Enter the name|revoked/i.test(m) ? m.replace(/^.*?ERROR:\s*/, '') : 'Something went wrong. Please try again.' }
}

async function ctx(cohort: string) {
  const c = await requireStaff(can.runClasses)
  if (!uuid.safeParse(cohort).success) throw new Error('Not allowed')
  return c
}

/** Director emails go out whenever someone other than a Director acts. */
async function report(role: string, actor: string, action: string, cohortId: string, items: string[]) {
  if (role === 'director' || !items.length) return
  const baseUrl = await siteUrl()
  after(() => notifyDirectorOfCertificates({ baseUrl }, { actor, action, cohortId, items }))
}

async function numbers(supabase: Awaited<ReturnType<typeof requireStaff>>['supabase'], ids: string[]) {
  if (!ids.length) return []
  const { data } = await supabase.from('certificates').select('certificate_no, holder_name').in('id', ids)
  return ((data ?? []) as { certificate_no: string; holder_name: string | null }[]).map((c) => `${c.certificate_no}: ${c.holder_name ?? ''}`)
}

export async function issueCertificates(_: ActionState, fd: FormData): Promise<ActionState> {
  const cohort = String(fd.get('cohort_id'))
  const enrolment = fd.get('enrolment_id') ? String(fd.get('enrolment_id')) : null
  try {
    const { supabase, staff } = await ctx(cohort)
    if (enrolment && !uuid.safeParse(enrolment).success) return { error: 'Student not found.' }
    const { data, error } = await supabase.rpc('staff_issue_certificates', { p_cohort: cohort, p_enrolment: enrolment })
    if (error) throw error
    const ids = (data ?? []) as string[]
    if (ids.length) {
      const baseUrl = await siteUrl()
      after(() => notifyCertificatesIssued({ baseUrl }, ids))
      await report(staff.role, staff.name, 'Certificates issued', cohort, await numbers(supabase, ids))
    }
    revalidatePath(path(cohort))
    return ids.length
      ? { ok: true, message: `${ids.length} certificate${ids.length === 1 ? '' : 's'} issued. Students have been emailed. Now download them for printing.` }
      : { ok: true, message: 'Everyone eligible already has a certificate.' }
  } catch (e) { return fail(e) }
}

export async function revokeCertificate(_: ActionState, fd: FormData): Promise<ActionState> {
  const cohort = String(fd.get('cohort_id'))
  const cert = String(fd.get('certificate_id'))
  const reason = String(fd.get('reason') ?? '').trim()
  const reissue = fd.get('reissue') === 'on'
  try {
    const { supabase, staff } = await ctx(cohort)
    if (!uuid.safeParse(cert).success) return { error: 'Certificate not found.' }
    const before = await numbers(supabase, [cert])
    const { data, error } = await supabase.rpc('staff_revoke_certificate', { p_cert: cert, p_reason: reason, p_reissue: reissue })
    if (error) throw error
    const newId = data as string | null
    const after_ = newId ? await numbers(supabase, [newId]) : []
    await report(staff.role, staff.name, reissue ? 'Certificate revoked and reissued' : 'Certificate revoked', cohort, [
      ...before.map((b) => `Revoked ${b}`), `Reason: ${reason}`, ...after_.map((a) => `New certificate ${a}`),
    ])
    if (newId) {
      const baseUrl = await siteUrl()
      after(() => notifyCertificatesIssued({ baseUrl }, [newId]))
    }
    revalidatePath(path(cohort))
    return { ok: true, message: newId ? `Revoked. New certificate ${after_[0]?.split(':')[0] ?? ''} issued; download it for printing.` : 'Certificate revoked. The online check now shows it as revoked.' }
  } catch (e) { return fail(e) }
}

export async function recordCollection(_: ActionState, fd: FormData): Promise<ActionState> {
  const cohort = String(fd.get('cohort_id'))
  const cert = String(fd.get('certificate_id'))
  const undo = fd.get('undo') === 'yes'
  try {
    const { supabase, staff } = await ctx(cohort)
    if (!uuid.safeParse(cert).success) return { error: 'Certificate not found.' }
    const who = String(fd.get('collected_by') ?? '')
    const note = String(fd.get('note') ?? '')
    const { error } = await supabase.rpc('staff_record_collection', { p_cert: cert, p_collected_by: who, p_note: note, p_undo: undo })
    if (error) throw error
    const n = await numbers(supabase, [cert])
    await report(staff.role, staff.name, undo ? 'Collection record removed' : 'Certificate collection recorded', cohort, n.map((x) => (undo ? x : `${x} (collected by ${who.trim()}${note.trim() ? `, ${note.trim()}` : ''})`)))
    revalidatePath(path(cohort))
    return { ok: true, message: undo ? 'Collection record removed.' : 'Collection recorded.' }
  } catch (e) { return fail(e) }
}
