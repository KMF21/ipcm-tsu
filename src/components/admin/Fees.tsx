'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Alert, Button, Input } from '@/components/ui'
import { saveFee } from '@/lib/admin/manage-actions'
import type { ActionState } from '@/lib/admin/actions'
import type { FeeRow } from '@/lib/admin/queries'
import { formatNaira } from '@/lib/utils'

function Save() {
  const { pending } = useFormStatus()
  return <Button type="submit" variant="secondary" loading={pending} className="w-full sm:w-auto">Save</Button>
}

function FeeForm({ fee }: { fee: FeeRow }) {
  const [state, action] = useActionState<ActionState, FormData>(saveFee, {})
  const label = fee.type === 'application' ? 'Application fee' : 'Tuition'
  return (
    <form action={action} className="rounded-xl border border-line p-4">
      <input type="hidden" name="id" value={fee.id} />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-navy">{label}</h3>
        <p className="text-sm text-ink-muted">Applicant pays <strong className="text-navy">{formatNaira(fee.base_amount_kobo + fee.processing_fee_kobo)}</strong></p>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label htmlFor={`b-${fee.id}`}>
          <span className="mb-1.5 block text-label font-semibold">Amount (₦)</span>
          <Input id={`b-${fee.id}`} name="base" inputMode="numeric" defaultValue={(fee.base_amount_kobo / 100).toString()} required />
        </label>
        <label htmlFor={`pr-${fee.id}`}>
          <span className="mb-1.5 block text-label font-semibold">Processing charge (₦)</span>
          <Input id={`pr-${fee.id}`} name="processing" inputMode="numeric" defaultValue={(fee.processing_fee_kobo / 100).toString()} required />
        </label>
        <Save />
      </div>
      <div className="mt-3 empty:hidden">
        {state.error && <Alert tone="error" title={state.error} />}
        {state.ok && state.message && <Alert tone="success" title={state.message} />}
      </div>
    </form>
  )
}

export function Fees({ fees, canEdit }: { fees: FeeRow[]; canEdit: boolean }) {
  const groups = new Map<string, FeeRow[]>()
  for (const f of fees) {
    const k = `${f.programmes?.code} · ${f.programmes?.short_title}`
    groups.set(k, [...(groups.get(k) ?? []), f])
  }
  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([title, items]) => (
        <section key={title} className="rounded-card border border-line bg-white p-5 shadow-card">
          <h2 className="text-h3 font-semibold text-navy">{title}</h2>
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-2">
            {items.map((f) =>
              canEdit ? (
                <FeeForm key={f.id} fee={f} />
              ) : (
                <div key={f.id} className="rounded-xl border border-line p-4">
                  <h3 className="font-semibold text-navy">{f.type === 'application' ? 'Application fee' : 'Tuition'}</h3>
                  <p className="mt-1 text-base">{formatNaira(f.base_amount_kobo)} + {formatNaira(f.processing_fee_kobo)} processing</p>
                </div>
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
