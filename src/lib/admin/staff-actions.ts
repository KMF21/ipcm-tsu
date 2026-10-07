'use server'

import { randomInt } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyPaymentConfirmed } from '@/lib/email/notify'
import { siteUrl } from '@/lib/site-url'
import { cleanSearch } from './queries-clean'
import { requireStaff } from './session'
import { can, type Role } from './roles'
import type { ActionState } from './actions'

const STAFF_ROLES = ['facilitator', 'editor', 'bursary', 'admissions', 'director', 'super_admin'] as const

/* ---------------- Bursary: record a bank or sponsor payment ---------------- */
export type RecordState = ActionState & { receiptId?: string; receiptNo?: string; regNo?: string | null }

export async function recordPayment(_: RecordState, fd: FormData): Promise<RecordState> {
  const { supabase } = await requireStaff(can.money)
  const ref = cleanSearch(String(fd.get('app_ref') ?? '')).toUpperCase().replace(/\s/g, '')
  const fee = fd.get('fee_type') === 'tuition' ? 'tuition' : 'application'
  const method = fd.get('method') === 'sponsor' ? 'sponsor' : 'manual'
  const bankRef = String(fd.get('bank_reference') ?? '').trim()
  const note = String(fd.get('note') ?? '').trim()
  if (!/^APP-\d{2}-[A-Z0-9]{6}$/.test(ref)) return { error: 'Enter the application number exactly, e.g. APP-26-B4T9LA.' }
  if (bankRef.length < 3) return { error: 'Enter the bank teller, transfer or invoice reference.' }
  const { data: app } = await supabase.from('applications').select('id').eq('ref', ref).maybeSingle()
  if (!app) return { error: `No application numbered ${ref}.` }
  const { data, error } = await supabase.rpc('staff_record_payment', { p_application: app.id, p_fee_type: fee, p_method: method, p_bank_reference: bankRef, p_note: note || null })
  if (error) {
    console.error('[admin] staff_record_payment', error.message)
    const known = /Only Bursary|already|offer|Enter the|not configured|not found/i.test(error.message)
    return { error: known ? error.message : 'We couldn’t record this payment. Please try again.' }
  }
  const r = data as { receipt_no: string; reg_no?: string | null; reference: string; payment_id: string }
  const baseUrl = await siteUrl()
  after(() => notifyPaymentConfirmed({ baseUrl }, r.reference))
  revalidatePath('/admin/payments')
  revalidatePath('/admin')
  return { ok: true, receiptId: r.payment_id, receiptNo: r.receipt_no, regNo: r.reg_no, message: fee === 'tuition' ? 'Tuition recorded. The applicant is admitted and has been emailed.' : 'Application fee recorded. The applicant can now complete the form.' }
}

/* ---------------- Super admin: staff accounts ---------------- */
export type StaffState = ActionState & { password?: string; email?: string }

const newStaff = z.object({
  first_name: z.string().trim().min(2, 'Enter a first name').max(60),
  surname: z.string().trim().min(2, 'Enter a surname').max(60),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  role: z.enum(STAFF_ROLES),
})

export async function createStaff(_: StaffState, fd: FormData): Promise<StaffState> {
  const { staff } = await requireStaff(can.manageStaff)
  const parsed = newStaff.safeParse(Object.fromEntries(fd))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }
  const d = parsed.data
  const password = `ipcm${String(randomInt(0, 1_000_000)).padStart(6, '0')}`
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({ email: d.email, password, email_confirm: true, user_metadata: { first_name: d.first_name, surname: d.surname } })
  if (error || !data.user) {
    if (!/already|registered|exists/i.test(error?.message ?? '')) return { error: 'We couldn’t create the account. Please try again.' }
    // The person already has an account (e.g. registered as an applicant): give it the staff role.
    const { data: existing } = await admin.from('profiles').select('id, role').eq('email', d.email).maybeSingle()
    if (!existing) return { error: 'An account with that email exists but could not be found. Please contact support.' }
    if (existing.id === staff.id) return { error: 'That is your own account.' }
    await admin.from('profiles').update({ role: d.role, is_active: true }).eq('id', existing.id)
    await admin.from('audit_log').insert({ actor_id: staff.id, action: 'staff.promoted', entity: 'profiles', entity_id: existing.id, before: { role: existing.role }, after: { role: d.role } })
    revalidatePath('/admin/staff')
    return { ok: true, message: `${d.email} already had an account. It now has the ${d.role.replace('_', ' ')} role; they sign in with their existing password.` }
  }
  // The profile row is created by the sign-up trigger; set the role with the service role.
  const { error: roleError } = await admin.from('profiles').update({ role: d.role, first_name: d.first_name, surname: d.surname }).eq('id', data.user.id)
  if (roleError) return { error: 'Account created but the role could not be set. Set it in the list below.' }
  await admin.from('audit_log').insert({ actor_id: staff.id, action: 'staff.created', entity: 'profiles', entity_id: data.user.id, after: { email: d.email, role: d.role } })
  revalidatePath('/admin/staff')
  return { ok: true, password, email: d.email, message: `${d.first_name} ${d.surname} can now sign in as ${d.role.replace('_', ' ')}.` }
}

/** Change a staff role, make someone staff, or switch an account off/on. Uses the signed-in super admin's session. */
export async function updateStaff(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, staff } = await requireStaff(can.manageStaff)
  const id = String(fd.get('user_id'))
  if (id === staff.id) return { error: 'You can’t change your own role or switch off your own account.' }
  const op = String(fd.get('op'))
  const patch: Record<string, unknown> = {}
  if (op === 'role') {
    const role = String(fd.get('role')) as Role
    if (!(STAFF_ROLES as readonly string[]).includes(role) && role !== 'applicant') return { error: 'Choose a role.' }
    patch.role = role
  } else if (op === 'deactivate') patch.is_active = false
  else if (op === 'activate') patch.is_active = true
  else return { error: 'Unknown action.' }
  const { error } = await supabase.from('profiles').update(patch).eq('id', id)
  if (error) return { error: 'We couldn’t save that change. Please try again.' }
  await createAdminClient().from('audit_log').insert({ actor_id: staff.id, action: `staff.${op}`, entity: 'profiles', entity_id: id, after: patch })
  revalidatePath('/admin/staff')
  return { ok: true, message: op === 'role' ? 'Role updated.' : op === 'deactivate' ? 'Account switched off. They can no longer use the admin portal.' : 'Account switched back on.' }
}

/* ---------------- Contact messages ---------------- */
export async function setMessageStatus(fd: FormData) {
  const { supabase } = await requireStaff(can.messages)
  const status = String(fd.get('status'))
  if (!['new', 'replied', 'closed'].includes(status)) return
  await supabase.from('contact_messages').update({ status }).eq('id', String(fd.get('id')))
  revalidatePath('/admin/messages')
}
