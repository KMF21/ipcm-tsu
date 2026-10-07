'use client'

import { useActionState } from 'react'
import { forgotPassword, resendVerification, resetPassword, type FormState } from '@/lib/auth/actions'
import { Alert, Button } from '@/components/ui'
import { FormError, PasswordField, SubmitButton, TextField } from './AuthForm'

export function ForgotForm() {
  const [state, action] = useActionState<FormState, FormData>(forgotPassword, {})
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormError message={state.message} />
      <TextField name="email" label="Email address" type="email" inputMode="email" autoComplete="email" error={state.errors?.email} defaultValue={state.values?.email} />
      <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>
    </form>
  )
}

export function ResetForm() {
  const [state, action] = useActionState<FormState, FormData>(resetPassword, {})
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormError message={state.message} />
      <PasswordField name="password" label="New password" autoComplete="new-password" hint="Any 8 or more characters. Tap the eye to check it." error={state.errors?.password} />
      <SubmitButton pendingLabel="Saving…">Save new password</SubmitButton>
    </form>
  )
}

export function ResendForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resendVerification, {})
  if (state.message === 'sent') return <Alert tone="success" title="We’ve sent a new link">Check your inbox and spam folder.</Alert>
  return (
    <form action={action} className="space-y-3">
      {state.message && <Alert tone="error" title={state.message} />}
      <input type="hidden" name="email" value={email} />
      <Button type="submit" variant="secondary" size="lg" className="w-full" loading={pending}>Resend confirmation email</Button>
    </form>
  )
}
