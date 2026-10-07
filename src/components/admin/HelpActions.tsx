'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Copy, KeyRound, Mail } from 'lucide-react'
import { Alert, Button, Input } from '@/components/ui'
import { correctEmail, setTemporaryPassword, type HelpState } from '@/lib/admin/help-actions'

function Submit({ children, variant = 'secondary' }: { children: React.ReactNode; variant?: 'primary' | 'secondary' }) {
  const { pending } = useFormStatus()
  return <Button type="submit" variant={variant} loading={pending} className="w-full sm:w-auto">{children}</Button>
}

export function HelpActions({ userId, email }: { userId: string; email: string }) {
  const [emailState, emailAction] = useActionState<HelpState, FormData>(correctEmail, {})
  const [pwState, pwAction] = useActionState<HelpState, FormData>(setTemporaryPassword, {})
  const [copied, setCopied] = useState(false)
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-2">
      <details className="rounded-xl border border-line">
        <summary className="flex min-h-[48px] cursor-pointer list-none items-center gap-2 px-4 font-semibold text-navy [&::-webkit-details-marker]:hidden"><Mail className="h-5 w-5 text-teal" aria-hidden /> Correct email</summary>
        <form action={emailAction} className="space-y-3 border-t border-line p-4">
          <input type="hidden" name="user_id" value={userId} />
          {emailState.error && <Alert tone="error" title={emailState.error} />}
          {emailState.ok && <Alert tone="success" title={emailState.message ?? 'Saved'} />}
          <label htmlFor={`em-${userId}`} className="block text-label font-semibold">Correct email address</label>
          <Input id={`em-${userId}`} name="email" type="email" defaultValue={email} required autoComplete="off" />
          <p className="text-sm text-ink-muted">Use this when they typed their email wrongly. Confirm the right address with them first.</p>
          <Submit>Save email</Submit>
        </form>
      </details>
      <details className="rounded-xl border border-line">
        <summary className="flex min-h-[48px] cursor-pointer list-none items-center gap-2 px-4 font-semibold text-navy [&::-webkit-details-marker]:hidden"><KeyRound className="h-5 w-5 text-teal" aria-hidden /> Give a new password</summary>
        <form action={pwAction} className="space-y-3 border-t border-line p-4">
          <input type="hidden" name="user_id" value={userId} />
          {pwState.error && <Alert tone="error" title={pwState.error} />}
          {pwState.password ? (
            <div className="rounded-xl border border-teal/40 bg-teal-50 p-4">
              <p className="text-sm font-semibold text-ink">{pwState.message}</p>
              <p className="mt-2 text-sm text-ink-muted">Read this to the applicant. It is shown only once.</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <code className="rounded-lg bg-white px-3 py-2 font-mono text-xl font-bold tracking-wider text-navy">{pwState.password}</code>
                <Button type="button" variant="ghost" onClick={() => { navigator.clipboard?.writeText(pwState.password!); setCopied(true) }}>
                  <Copy className="h-4 w-4" aria-hidden /> {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <p className="mt-2 text-sm text-ink-muted">Ask them to sign in with it, then change it under Forgot password if they want their own.</p>
            </div>
          ) : (
            <>
              <p className="text-base text-ink">For applicants who can’t sign in and can’t use the reset email. This replaces their current password.</p>
              <Submit variant="primary">Create new password</Submit>
            </>
          )}
        </form>
      </details>
    </div>
  )
}
