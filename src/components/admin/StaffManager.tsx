'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Copy, UserPlus } from 'lucide-react'
import { Alert, Badge, Button, Field, Input, Select } from '@/components/ui'
import { createStaff, updateStaff, type StaffState } from '@/lib/admin/staff-actions'
import type { ActionState } from '@/lib/admin/actions'
import { ROLE_LABEL, type Role } from '@/lib/admin/roles'

const ROLES: Role[] = ['admissions', 'bursary', 'director', 'editor', 'facilitator', 'super_admin']
const ROLE_HELP: Record<string, string> = {
  admissions: 'Reviews applications and documents, makes offers, helps applicants',
  bursary: 'Payments, receipts, fees, records bank payments',
  director: 'Everything in admissions and bursary, plus intakes',
  editor: 'Website people and research posts',
  facilitator: 'Teaching tools (Phase 2)',
  super_admin: 'Everything, including staff accounts',
}

function Submit({ children, variant = 'primary' }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' }) {
  const { pending } = useFormStatus()
  return <Button type="submit" variant={variant} loading={pending}>{children}</Button>
}

export function AddStaffForm() {
  const [s, action] = useActionState<StaffState, FormData>(createStaff, {})
  const [copied, setCopied] = useState(false)
  return (
    <form action={action} className="space-y-4" key={s.ok ? s.email ?? 'ok' : 'form'}>
      {s.error && <Alert tone="error" title={s.error} />}
      {s.ok && (
        <Alert tone="success" title={s.message ?? 'Done'}>
          {s.password && (
            <div className="mt-2">
              <p>Give them this password to sign in at /login with <strong>{s.email}</strong>. It is shown only once; ask them to change it under Forgot password.</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <code className="rounded-lg bg-white px-3 py-2 font-mono text-xl font-bold tracking-wider text-navy">{s.password}</code>
                <Button type="button" variant="ghost" onClick={() => { navigator.clipboard?.writeText(s.password!); setCopied(true) }}><Copy className="h-4 w-4" aria-hidden /> {copied ? 'Copied' : 'Copy'}</Button>
              </div>
            </div>
          )}
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="st-first" label="First name" required><Input id="st-first" name="first_name" required /></Field>
        <Field id="st-sur" label="Surname" required><Input id="st-sur" name="surname" required /></Field>
        <Field id="st-email" label="Work email" required><Input id="st-email" name="email" type="email" required /></Field>
        <Field id="st-role" label="Role" required>
          <Select id="st-role" name="role" defaultValue="admissions">{ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</Select>
        </Field>
      </div>
      <Submit><UserPlus className="h-5 w-5" aria-hidden /> Add staff member</Submit>
    </form>
  )
}

export type StaffRow = { id: string; name: string; email: string; role: Role; is_active: boolean; created_at: string }

export function StaffRowForm({ s, self }: { s: StaffRow; self: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(updateStaff, {})
  return (
    <li className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-navy">{s.name}{self && <span className="ml-2 text-sm font-normal text-ink-muted">(you)</span>}</p>
        <p className="break-all text-sm text-ink-muted">{s.email}</p>
        {state.error && <p className="mt-1 text-sm font-semibold text-crimson">{state.error}</p>}
        {state.ok && <p className="mt-1 text-sm font-semibold text-success">{state.message}</p>}
      </div>
      {!s.is_active && <Badge tone="crimson">Switched off</Badge>}
      {self ? (
        <Badge tone="navy">{ROLE_LABEL[s.role]}</Badge>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <form action={action} className="flex gap-2">
            <input type="hidden" name="user_id" value={s.id} />
            <input type="hidden" name="op" value="role" />
            <label className="sr-only" htmlFor={`role-${s.id}`}>Role for {s.name}</label>
            <Select id={`role-${s.id}`} name="role" defaultValue={s.role} className="min-w-[180px]">
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              <option value="applicant">Remove staff access</option>
            </Select>
            <Submit variant="secondary">Save</Submit>
          </form>
          <form action={action}>
            <input type="hidden" name="user_id" value={s.id} />
            <input type="hidden" name="op" value={s.is_active ? 'deactivate' : 'activate'} />
            <Submit variant="ghost">{s.is_active ? 'Switch off' : 'Switch on'}</Submit>
          </form>
        </div>
      )}
    </li>
  )
}

export function RoleGuide() {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {ROLES.map((r) => (
        <div key={r} className="rounded-xl bg-canvas p-3"><dt className="font-semibold text-navy">{ROLE_LABEL[r]}</dt><dd className="text-sm text-ink-muted">{ROLE_HELP[r]}</dd></div>
      ))}
    </dl>
  )
}
