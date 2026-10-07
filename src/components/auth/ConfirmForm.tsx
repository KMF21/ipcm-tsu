'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { confirmEmailLink, type FormState } from '@/lib/auth/actions'
import { Alert, ButtonLink } from '@/components/ui'
import { SubmitButton } from './AuthForm'

export function ConfirmForm({ tokenHash, type }: { tokenHash: string; type: string }) {
  const [state, action] = useActionState<FormState, FormData>(confirmEmailLink, {})
  const recovery = type === 'recovery'
  if (state.message) {
    return (
      <div className="space-y-4">
        <Alert tone="error" title={state.message} />
        {recovery ? (
          <ButtonLink href="/forgot-password" size="lg" className="w-full">Request a new reset link</ButtonLink>
        ) : (
          <>
            <ButtonLink href="/login" size="lg" className="w-full">Log in</ButtonLink>
            <p className="text-center text-base text-ink-muted">
              Not confirmed yet? <Link href="/register" className="font-semibold text-teal hover:underline">Sign up again</Link> or use “Resend” on the confirmation screen.
            </p>
          </>
        )}
      </div>
    )
  }
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token_hash" value={tokenHash} />
      <input type="hidden" name="type" value={type} />
      <SubmitButton pendingLabel={recovery ? 'Checking…' : 'Confirming…'}>{recovery ? 'Continue to reset password' : 'Confirm my email'}</SubmitButton>
    </form>
  )
}
