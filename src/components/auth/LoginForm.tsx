'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signIn, type FormState } from '@/lib/auth/actions'
import { FormError, PasswordField, SubmitButton, TextField } from './AuthForm'

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(signIn, {})
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormError message={state.message} />
      <input type="hidden" name="next" value={next ?? ''} />
      <TextField name="email" label="Email address" type="email" inputMode="email" autoComplete="email" error={state.errors?.email} defaultValue={state.values?.email} />
      <div>
        <PasswordField name="password" label="Password" autoComplete="current-password" error={state.errors?.password} />
        <p className="mt-2 text-right">
          <Link href="/forgot-password" className="inline-flex min-h-[44px] items-center font-semibold text-teal hover:underline">Forgot password?</Link>
        </p>
      </div>
      <SubmitButton pendingLabel="Logging in…">Log in</SubmitButton>
    </form>
  )
}
