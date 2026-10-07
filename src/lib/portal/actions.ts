'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { normaliseNigerianPhone } from '@/lib/validation/auth'

export type FormState = { ok?: boolean; message?: string; error?: string; errors?: Record<string, string> }

async function me() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function updateContactDetails(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase, user } = await me()
  if (!user) return { error: 'Please sign in again.' }
  const phone = normaliseNigerianPhone(String(fd.get('phone') ?? ''))
  const address = String(fd.get('address') ?? '').trim()
  const errors: Record<string, string> = {}
  if (!phone) errors.phone = 'Enter a valid Nigerian phone number, e.g. 0803 000 0000'
  if (address.length < 5) errors.address = 'Enter your address'
  if (address.length > 300) errors.address = 'Keep the address under 300 characters'
  if (Object.keys(errors).length) return { errors }
  const { error } = await supabase.from('profiles').update({ phone, address }).eq('id', user.id)
  if (error) return { error: 'We couldn’t save your details. Please try again.' }
  revalidatePath('/portal/profile')
  return { ok: true, message: 'Contact details saved.' }
}

const pw = z
  .object({ current: z.string().min(1, 'Enter your current password'), password: z.string().min(8, 'Use at least 8 characters'), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: 'The two new passwords don’t match', path: ['confirm'] })
  .refine((v) => v.password !== v.current, { message: 'Choose a password different from your current one', path: ['password'] })

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase, user } = await me()
  if (!user?.email) return { error: 'Please sign in again.' }
  const parsed = pw.safeParse(Object.fromEntries(fd))
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message
    return { errors }
  }
  // Confirm it's really them before changing the password.
  const { error: wrong } = await supabase.auth.signInWithPassword({ email: user.email, password: parsed.data.current })
  if (wrong) return { errors: { current: 'That isn’t your current password' } }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { error: 'We couldn’t change your password. Please try again.' }
  return { ok: true, message: 'Password changed. Use the new one next time you sign in.' }
}
