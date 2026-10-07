'use server'

import { revalidatePath } from 'next/cache'
import { requireStaff } from './session'
import { can } from './roles'

export type ActionState = { ok?: boolean; message?: string; error?: string }

/** Database messages from staff_* functions are written for people; anything else gets a safe default. */
function friendly(message: string) {
  const known = /Only |Approve every|Reject at least|intake is full|Give a reason|Choose today|at most 90|between 1 and 60|no documents|can only be|Only an open offer|not found/i
  return known.test(message) ? message.replace(/^.*?ERROR:\s*/, '') : 'Something went wrong. Please try again.'
}

async function run(path: string, fn: string, args: Record<string, unknown>, done: string): Promise<ActionState> {
  const { supabase } = await requireStaff(can.review)
  const { error } = await supabase.rpc(fn, args)
  if (error) {
    console.error(`[admin] ${fn}`, error.message)
    return { error: friendly(error.message) }
  }
  revalidatePath(path)
  revalidatePath('/admin')
  return { ok: true, message: done }
}

const appPath = (id: string) => `/admin/applications/${id}`

export async function startReview(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get('application_id'))
  return run(appPath(id), 'staff_start_review', { p_app: id }, 'Review started.')
}

export async function reviewDocument(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get('application_id'))
  const approve = fd.get('decision') === 'approve'
  const reason = String(fd.get('reason') ?? '').trim()
  if (!approve && !reason) return { error: 'Say what is wrong so the applicant knows what to fix.' }
  return run(appPath(id), 'staff_review_document', { p_doc: String(fd.get('document_id')), p_approve: approve, p_reason: approve ? null : reason }, approve ? 'Document approved.' : 'Document rejected.')
}

export async function requestChanges(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get('application_id'))
  return run(appPath(id), 'staff_request_changes', { p_app: id, p_note: String(fd.get('note') ?? '').trim() || null }, 'The applicant has been asked to replace the rejected documents.')
}

export async function makeOffer(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get('application_id'))
  const days = Number(fd.get('days'))
  if (!Number.isInteger(days) || days < 1 || days > 60) return { error: 'Offer length must be between 1 and 60 days.' }
  return run(appPath(id), 'staff_make_offer', { p_app: id, p_days: days }, 'Offer made. The applicant can now pay tuition.')
}

export async function declineApplication(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get('application_id'))
  const reason = String(fd.get('reason') ?? '').trim()
  if (reason.length < 10) return { error: 'Give a clear reason (at least a short sentence). The applicant will see it.' }
  return run(appPath(id), 'staff_decline', { p_app: id, p_reason: reason }, 'Application declined.')
}

export async function extendOffer(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get('application_id'))
  const until = String(fd.get('until') ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(until)) return { error: 'Choose a date.' }
  return run(appPath(id), 'staff_extend_offer', { p_app: id, p_until: until }, 'Offer extended.')
}

export async function withdrawOffer(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get('application_id'))
  const reason = String(fd.get('reason') ?? '').trim()
  if (reason.length < 5) return { error: 'Give a reason for withdrawing the offer.' }
  return run(appPath(id), 'staff_withdraw_offer', { p_app: id, p_reason: reason }, 'Offer withdrawn.')
}
