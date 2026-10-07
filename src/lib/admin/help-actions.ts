'use server'

import { randomInt } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireStaff } from './session'
import { can } from './roles'
import type { ActionState } from './actions'

export type HelpState = ActionState & { password?: string }

/** Staff may only help applicant and student accounts, never other staff. */
async function target(userId: string) {
  const { supabase, staff } = await requireStaff(can.helpApplicants)
  if (!z.string().uuid().safeParse(userId).success) return { error: 'Account not found.' as const }
  const { data: p } = await supabase.from('profiles').select('id, email, role, first_name, surname').eq('id', userId).single()
  if (!p) return { error: 'Account not found.' as const }
  if (p.role !== 'applicant' && p.role !== 'student') return { error: 'Staff accounts can only be changed by a super admin.' as const }
  return { staff, person: p }
}

async function audit(actor: string, action: string, entityId: string, before: unknown, after: unknown) {
  await createAdminClient().from('audit_log').insert({ actor_id: actor, action, entity: 'profiles', entity_id: entityId, before, after })
}

export async function correctEmail(_: HelpState, fd: FormData): Promise<HelpState> {
  const t = await target(String(fd.get('user_id')))
  if ('error' in t) return { error: t.error }
  const email = z.string().trim().toLowerCase().email().safeParse(fd.get('email'))
  if (!email.success) return { error: 'Enter a valid email address.' }
  if (email.data === t.person.email) return { error: 'That is already their email.' }
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(t.person.id, { email: email.data, email_confirm: true })
  if (error) {
    console.error('[admin] correctEmail', error.message)
    return { error: /already|registered|exists/i.test(error.message) ? 'Another account already uses that email.' : 'We couldn’t change the email. Please try again.' }
  }
  await admin.from('profiles').update({ email: email.data }).eq('id', t.person.id)
  await audit(t.staff.id, 'help.email_corrected', t.person.id, { email: t.person.email }, { email: email.data })
  revalidatePath('/admin/help')
  return { ok: true, message: `Email changed to ${email.data}. They sign in with the new email from now on.` }
}

/** Easy to read out over the phone: "ipcm" followed by six digits. */
function temporaryPassword() {
  return `ipcm${String(randomInt(0, 1_000_000)).padStart(6, '0')}`
}

export async function setTemporaryPassword(_: HelpState, fd: FormData): Promise<HelpState> {
  const t = await target(String(fd.get('user_id')))
  if ('error' in t) return { error: t.error }
  const password = temporaryPassword()
  const { error } = await createAdminClient().auth.admin.updateUserById(t.person.id, { password })
  if (error) {
    console.error('[admin] setTemporaryPassword', error.message)
    return { error: 'We couldn’t set a new password. Please try again.' }
  }
  await audit(t.staff.id, 'help.password_reset', t.person.id, null, { by: t.staff.email })
  return { ok: true, password, message: 'New password set. Their old password no longer works.' }
}
