'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { forgotSchema, resetSchema, signInSchema, signUpSchema, type FieldErrors } from '@/lib/validation/auth'
import { homeForRole, safeNext } from './paths'

export type FormState = {
  errors?: FieldErrors
  message?: string // form-level error
  values?: Record<string, string> // echoed back so fields keep their input
}

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]): FieldErrors {
  const out: FieldErrors = {}
  for (const i of issues) {
    const key = String(i.path[0] ?? 'form')
    if (!out[key]) out[key] = i.message
  }
  return out
}

function keep(fd: FormData, ...names: string[]) {
  return Object.fromEntries(names.map((n) => [n, String(fd.get(n) ?? '')]))
}

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const h = await headers()
  return `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`
}

/** Supabase error messages are written for developers; translate the common ones. */
function friendly(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'That email and password don’t match. Check them and try again.'
  if (m.includes('email not confirmed')) return 'Please confirm your email first. Check your inbox for the link we sent.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'An account with this email already exists. Log in instead.'
  // Supabase project limits (Authentication → Rate Limits). Email-sending limit is separate from attempt limits.
  if (m.includes('email rate limit')) return 'We can’t send more emails right now. Please try again in an hour, or ask the IPCM office for help.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts from this network. Please wait a few minutes and try again.'
  if (m.includes('should be different')) return 'Choose a password different from your old one.'
  if (m.includes('weak') || m.includes('pwned')) return 'That password is too easy to guess. Choose a stronger one.'
  return 'Something went wrong. Please try again in a moment.'
}

export async function signUp(_: FormState, fd: FormData): Promise<FormState> {
  const values = keep(fd, 'firstName', 'surname', 'email')
  const parsed = signUpSchema.safeParse(Object.fromEntries(fd))
  if (!parsed.success) return { errors: fieldErrors(parsed.error.issues), values }

  const { firstName, surname, email, password } = parsed.data
  const next = safeNext(String(fd.get('next') ?? ''), '/portal')
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // first_name/surname are read by the handle_new_user trigger; intended_programme
      // lets the confirmation link take the applicant straight to the right application.
      data: { first_name: firstName, surname, intended_programme: (next.match(/programme=([A-Z]{2,5})/) ?? [])[1] ?? null },
      emailRedirectTo: `${await siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })
  if (error) {
    const msg = friendly(error.message)
    return msg.includes('already exists') ? { errors: { email: msg }, values } : { message: msg, values }
  }
  // Supabase returns a user with no identities when the email is already registered (to avoid leaking it).
  if (data.user && data.user.identities?.length === 0) {
    return { errors: { email: 'An account with this email already exists. Log in instead.' }, values }
  }
  // With "Confirm email" switched off in Supabase, sign-up returns a session straight away:
  // the applicant goes directly to their application. If confirmation is ever switched back on,
  // there's no session yet, so we fall back to the "check your email" screen.
  if (data.session) {
    const programme = (next.match(/programme=([A-Z]{2,5})/) ?? [])[1]
    redirect(`/portal/apply?welcome=1${programme ? `&programme=${programme}` : ''}`)
  }
  redirect(`/verify-email?email=${encodeURIComponent(email)}`)
}

export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  const values = keep(fd, 'email')
  const parsed = signInSchema.safeParse(Object.fromEntries(fd))
  if (!parsed.success) return { errors: fieldErrors(parsed.error.issues), values }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { message: friendly(error.message), values }

  const { data: profile } = await supabase.from('profiles').select('role, is_active').eq('id', data.user.id).single()
  if (profile && !profile.is_active) {
    await supabase.auth.signOut()
    return { message: 'This account has been deactivated. Please contact the institute.', values }
  }
  const requested = String(fd.get('next') ?? '')
  redirect(requested ? safeNext(requested, homeForRole(profile?.role)) : homeForRole(profile?.role))
}

export async function forgotPassword(_: FormState, fd: FormData): Promise<FormState> {
  const values = keep(fd, 'email')
  const parsed = forgotSchema.safeParse(Object.fromEntries(fd))
  if (!parsed.success) return { errors: fieldErrors(parsed.error.issues), values }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteUrl()}/auth/callback?next=/reset-password`,
  })
  // Same response whether or not the email exists, so accounts can't be discovered.
  if (error && friendly(error.message).startsWith('Too many')) return { message: friendly(error.message), values }
  redirect(`/forgot-password/sent?email=${encodeURIComponent(parsed.data.email)}`)
}

export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(fd))
  if (!parsed.success) return { errors: fieldErrors(parsed.error.issues) }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Your reset link has expired. Please request a new one.' }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { message: friendly(error.message) }
  redirect('/login?reset=1')
}

export async function resendVerification(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get('email') ?? '')
  const parsed = forgotSchema.safeParse({ email })
  if (!parsed.success) return { message: 'Enter a valid email address.' }
  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: parsed.data.email,
    options: { emailRedirectTo: `${await siteUrl()}/auth/callback?next=/portal` },
  })
  if (error) return { message: friendly(error.message) }
  return { message: 'sent' }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login?signedout=1')
}

/**
 * Confirms an email link (sign-up or password recovery) using the token hash.
 * Works in any browser or device, unlike the code flow, and only runs when the
 * person presses the button — so email security scanners can't use the link up.
 */
export async function confirmEmailLink(_: FormState, fd: FormData): Promise<FormState> {
  const token_hash = String(fd.get('token_hash') ?? '')
  const rawType = String(fd.get('type') ?? 'email')
  const type = (['email', 'signup', 'recovery', 'email_change', 'invite'] as const).find((t) => t === rawType) ?? 'email'
  if (!token_hash) return { message: 'This link is incomplete. Please use the full link from your email.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash })
  if (error || !data.user) {
    return {
      message:
        type === 'recovery'
          ? 'This reset link has expired or was already used. Please request a new one.'
          : 'This link has expired or was already used. If you already confirmed your email, you can simply log in.',
    }
  }
  if (type === 'recovery') redirect('/reset-password')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
  const intended = (data.user.user_metadata?.intended_programme as string | undefined) ?? ''
  if (!profile || profile.role === 'applicant') {
    redirect(`/portal/apply?welcome=1${/^[A-Z]{2,5}$/.test(intended) ? `&programme=${intended}` : ''}`)
  }
  redirect(homeForRole(profile.role))
}
