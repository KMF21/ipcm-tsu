'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Copy, KeyRound, Mail, UserPen } from 'lucide-react'
import { Alert, Button, Field, Input, Select } from '@/components/ui'
import { correctEmail, correctName, setTemporaryPassword, type HelpState, type NameState } from '@/lib/admin/help-actions'
import { TITLES } from '@/lib/application/steps'

function Submit({ children, variant = 'secondary' }: { children: React.ReactNode; variant?: 'primary' | 'secondary' }) {
  const { pending } = useFormStatus()
  return <Button type="submit" variant={variant} loading={pending} className="w-full sm:w-auto">{children}</Button>
}

type Person = { title: string | null; first_name: string | null; other_names: string | null; surname: string | null; role: string }

export function HelpActions({ userId, email, person }: { userId: string; email: string; person: Person }) {
  const [emailState, emailAction] = useActionState<HelpState, FormData>(correctEmail, {})
  const [pwState, pwAction] = useActionState<HelpState, FormData>(setTemporaryPassword, {})
  const [copied, setCopied] = useState(false)
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-2">
      <NameForm userId={userId} person={person} />
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

function NameForm({ userId, person }: { userId: string; person: Person }) {
  const [s, action] = useActionState<NameState, FormData>(correctName, {})
  const id = (k: string) => `${k}-${userId}`
  return (
    <details className="rounded-xl border border-line lg:col-span-2">
      <summary className="flex min-h-[48px] cursor-pointer list-none items-center gap-2 px-4 font-semibold text-navy [&::-webkit-details-marker]:hidden"><UserPen className="h-5 w-5 text-teal" aria-hidden /> Correct name</summary>
      <form action={action} className="space-y-4 border-t border-line p-4" onSubmit={(e) => { if (!confirm('Correct this name? The change is logged and the person is emailed.')) e.preventDefault() }}>
        <input type="hidden" name="user_id" value={userId} />
        {s.error && <Alert tone="error" title={s.error} />}
        {s.ok && <Alert tone="success" title={s.message ?? 'Saved'} />}
        {s.ok && s.certificates && s.certificates.length > 0 && (
          <Alert tone="warning" title="Their certificate still shows the old name">
            {`Certificate ${s.certificates.join(', ')} was issued with the old name. To print the corrected name, the Director revokes it and issues a replacement (Classes → intake → Certificates → Revoke or replace).`}
          </Alert>
        )}
        <p className="text-base text-ink">{person.role === 'student'
          ? 'This student is admitted, so they can’t change their own name. Check it against an official document (WAEC result, birth certificate, ID) before saving.'
          : 'Applicants can usually fix their own name in their profile. Use this when they can’t.'}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={id('nt')} label="Title (optional)">
            <Select id={id('nt')} name="title" defaultValue={person.title ?? ''}>
              <option value="">None</option>
              {TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field id={id('nf')} label="First name" required><Input id={id('nf')} name="first_name" defaultValue={person.first_name ?? ''} required autoComplete="off" /></Field>
          <Field id={id('no')} label="Other names (optional)"><Input id={id('no')} name="other_names" defaultValue={person.other_names ?? ''} autoComplete="off" /></Field>
          <Field id={id('ns')} label="Surname" required><Input id={id('ns')} name="surname" defaultValue={person.surname ?? ''} required autoComplete="off" /></Field>
          <div className="sm:col-span-2">
            <Field id={id('nr')} label="Reason" required hint="Kept in the activity log, for example: spelling as on WAEC result">
              <Input id={id('nr')} name="reason" required minLength={5} autoComplete="off" />
            </Field>
          </div>
        </div>
        <Submit variant="primary">Save corrected name</Submit>
      </form>
    </details>
  )
}
