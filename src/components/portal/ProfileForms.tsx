'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Alert, Button, Field, Input, Textarea } from '@/components/ui'
import { changePassword, updateContactDetails, type FormState } from '@/lib/portal/actions'

function Save({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return <Button type="submit" loading={pending} className="w-full sm:w-auto">{label}</Button>
}

export function ContactDetailsForm({ phone, address }: { phone: string; address: string }) {
  const [s, action] = useActionState<FormState, FormData>(updateContactDetails, {})
  return (
    <form action={action} className="space-y-4">
      {s.ok && <Alert tone="success" title={s.message ?? 'Saved'} />}
      {s.error && <Alert tone="error" title={s.error} />}
      <Field id="pf-phone" label="Phone number" error={s.errors?.phone}>
        <Input id="pf-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={phone} invalid={!!s.errors?.phone} />
      </Field>
      <Field id="pf-address" label="Address" error={s.errors?.address}>
        <Textarea id="pf-address" name="address" defaultValue={address} rows={3} className="min-h-[96px]" invalid={!!s.errors?.address} />
      </Field>
      <Save label="Save details" />
    </form>
  )
}

export function PasswordForm() {
  const [s, action] = useActionState<FormState, FormData>(changePassword, {})
  return (
    <form action={action} className="space-y-4" key={s.ok ? 'done' : 'form'}>
      {s.ok && <Alert tone="success" title={s.message ?? 'Saved'} />}
      {s.error && <Alert tone="error" title={s.error} />}
      <Field id="pw-current" label="Current password" error={s.errors?.current}>
        <Input id="pw-current" name="current" type="password" autoComplete="current-password" invalid={!!s.errors?.current} />
      </Field>
      <Field id="pw-new" label="New password" hint="At least 8 characters. Your phone number works." error={s.errors?.password}>
        <Input id="pw-new" name="password" type="password" autoComplete="new-password" invalid={!!s.errors?.password} />
      </Field>
      <Field id="pw-confirm" label="Type the new password again" error={s.errors?.confirm}>
        <Input id="pw-confirm" name="confirm" type="password" autoComplete="new-password" invalid={!!s.errors?.confirm} />
      </Field>
      <Save label="Change password" />
    </form>
  )
}
