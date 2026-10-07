'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { Landmark } from 'lucide-react'
import { Alert, Button, Field, Input, Select } from '@/components/ui'
import { recordPayment, type RecordState } from '@/lib/admin/staff-actions'

function Save() {
  const { pending } = useFormStatus()
  return <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto">Record payment</Button>
}

export function RecordPaymentForm() {
  const [s, action] = useActionState<RecordState, FormData>(recordPayment, {})
  return (
    <details className="group rounded-card border border-line bg-white shadow-card" open={!!s.error}>
      <summary className="flex min-h-[56px] cursor-pointer list-none items-center gap-3 px-5 font-semibold text-navy [&::-webkit-details-marker]:hidden">
        <Landmark className="h-5 w-5 text-teal" aria-hidden /> Record a bank or sponsor payment
      </summary>
      <form action={action} className="space-y-4 border-t border-line p-5" key={s.ok ? s.receiptId : 'form'}>
        <p className="text-base text-ink-muted">For money paid into the Institute’s bank account instead of through Paystack. The applicant gets the same receipt and email, and tuition admits them straight away. Check the money has arrived before recording it.</p>
        {s.error && <Alert tone="error" title={s.error} />}
        {s.ok && (
          <Alert tone="success" title={s.message ?? 'Recorded'}>
            Receipt {s.receiptNo}{s.regNo ? ` · registration number ${s.regNo}` : ''}. <Link href={`/admin/payments/${s.receiptId}`} className="font-semibold text-teal underline">Open receipt</Link>
          </Alert>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="rp-ref" label="Application number" required hint="From the applicant’s portal or emails">
            <Input id="rp-ref" name="app_ref" placeholder="APP-26-B4T9LA" autoCapitalize="characters" className="font-mono uppercase" required />
          </Field>
          <Field id="rp-fee" label="Paid for" required>
            <Select id="rp-fee" name="fee_type" defaultValue="tuition"><option value="application">Application fee</option><option value="tuition">Tuition</option></Select>
          </Field>
          <Field id="rp-method" label="How it was paid" required>
            <Select id="rp-method" name="method" defaultValue="manual"><option value="manual">Bank payment by the applicant</option><option value="sponsor">Paid by a sponsor organisation</option></Select>
          </Field>
          <Field id="rp-bank" label="Teller, transfer or invoice reference" required>
            <Input id="rp-bank" name="bank_reference" required />
          </Field>
        </div>
        <Field id="rp-note" label="Note" hint="For example the bank, date paid, or sponsor name">
          <Input id="rp-note" name="note" placeholder="First Bank Jalingo, 12 Jan 2027" />
        </Field>
        <Save />
      </form>
    </details>
  )
}
