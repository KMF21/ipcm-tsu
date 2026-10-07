'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Lock } from 'lucide-react'
import { startPayment, type PayState } from '@/lib/payments/actions'
import { Alert, Button } from '@/components/ui'

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" className="w-full" loading={pending}>
      {pending ? 'Opening secure payment…' : <><Lock className="h-5 w-5" aria-hidden /> {label}</>}
    </Button>
  )
}

export function PayButton({ feeType, label }: { feeType: 'application' | 'tuition'; label: string }) {
  const [state, action] = useActionState<PayState, FormData>(startPayment, {})
  return (
    <form action={action} className="space-y-3">
      {state.message && <Alert tone="error" title={state.message} />}
      <input type="hidden" name="fee_type" value={feeType} />
      <Submit label={label} />
      <p className="text-center text-sm text-ink-muted">You’ll pay on Paystack’s secure page, then come straight back here.</p>
    </form>
  )
}
