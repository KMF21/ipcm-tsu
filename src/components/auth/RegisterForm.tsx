'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signUp, type FormState } from '@/lib/auth/actions'
import { FormError, PasswordField, SubmitButton, TextField } from './AuthForm'

export function RegisterForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(signUp, {})
  const e = state.errors ?? {}
  const v = state.values ?? {}
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormError message={state.message} />
      <input type="hidden" name="next" value={next ?? ''} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="firstName" label="First name" autoComplete="given-name" error={e.firstName} defaultValue={v.firstName} />
        <TextField name="surname" label="Surname" autoComplete="family-name" error={e.surname} defaultValue={v.surname} />
      </div>
      <TextField name="email" label="Email address" type="email" inputMode="email" autoComplete="email" hint="We’ll send a confirmation link here" error={e.email} defaultValue={v.email} />
      <TextField name="phone" label="Phone number" type="tel" inputMode="tel" autoComplete="tel" placeholder="0803 000 0000" hint="For admission updates" error={e.phone} defaultValue={v.phone} />
      <PasswordField name="password" label="Create a password" autoComplete="new-password" hint="At least 8 characters" error={e.password} />
      <PasswordField name="confirmPassword" label="Confirm password" autoComplete="new-password" error={e.confirmPassword} />
      <div>
        <label className="flex cursor-pointer items-start gap-3 text-base text-ink">
          <input type="checkbox" name="terms" className="mt-1 h-5 w-5 shrink-0 rounded border-line accent-teal" aria-invalid={!!e.terms || undefined} />
          <span>
            I agree to the processing of my personal data as described in the{' '}
            <Link href="/privacy" className="font-semibold text-teal hover:underline">privacy notice</Link>.
          </span>
        </label>
        {e.terms && <p className="mt-2 text-sm font-medium text-crimson" role="alert">{e.terms}</p>}
      </div>
      <SubmitButton pendingLabel="Creating your account…">Create account</SubmitButton>
    </form>
  )
}
