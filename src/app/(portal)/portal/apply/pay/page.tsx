import { redirect } from 'next/navigation'
import { CreditCard, Landmark, Smartphone } from 'lucide-react'
import { Alert, Badge, Button, ButtonLink, Card } from '@/components/ui'
import { createClient } from '@/lib/supabase/server'
import { getMyApplication } from '@/lib/application/queries'
import { LAST_STEP, type StepData } from '@/lib/application/steps'
import { formatNaira } from '@/lib/utils'

export const metadata = { title: 'Payment' }

export default async function PayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/portal/apply/pay')
  const app = await getMyApplication(supabase, user.id)
  if (!app) redirect('/portal/apply')

  const data = app.step_data as StepData
  const isApplicationFee = app.status === 'draft'
  const isTuition = app.status === 'offered'
  if (isApplicationFee && !(data.completed ?? []).includes(LAST_STEP)) redirect('/portal/apply?step=8')
  if (!isApplicationFee && !isTuition) redirect('/portal/apply')

  const { data: fee } = await supabase
    .from('fee_items')
    .select('base_amount_kobo, processing_fee_kobo')
    .eq('programme_id', app.programme_id)
    .eq('type', isApplicationFee ? 'application' : 'tuition')
    .single()
  const base = fee?.base_amount_kobo ?? 0
  const processing = fee?.processing_fee_kobo ?? 0

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-label font-semibold uppercase tracking-wide text-teal">{isApplicationFee ? 'Final step' : 'Secure your seat'}</p>
        <Badge tone="navy">{app.ref}</Badge>
      </div>
      <h1 className="mt-2 text-[1.75rem] font-bold leading-9 sm:text-h1">{isApplicationFee ? 'Pay the application fee' : 'Pay your tuition'}</h1>
      <p className="mt-2 text-base text-ink-muted">
        {isApplicationFee ? 'Your application is submitted as soon as this payment is confirmed.' : 'Your registration number and admission letter are issued as soon as this payment is confirmed.'}
      </p>
      <Card className="mt-6">
        <dl className="space-y-3 text-base">
          <div className="flex justify-between gap-4"><dt className="text-ink-muted">{app.programmes?.code} {isApplicationFee ? 'application fee' : 'tuition'}</dt><dd className="font-semibold text-navy">{formatNaira(base)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-ink-muted">Processing charge</dt><dd className="font-semibold text-navy">{formatNaira(processing)}</dd></div>
          <div className="flex justify-between gap-4 border-t border-line pt-3 text-lg"><dt className="font-semibold text-navy">Total</dt><dd className="font-display font-bold text-navy">{formatNaira(base + processing)}</dd></div>
        </dl>
        <ul className="mt-6 grid grid-cols-3 gap-2 text-center text-sm text-ink-muted">
          <li className="rounded-xl bg-canvas p-3"><CreditCard className="mx-auto mb-1 h-5 w-5 text-teal" aria-hidden />Card</li>
          <li className="rounded-xl bg-canvas p-3"><Landmark className="mx-auto mb-1 h-5 w-5 text-teal" aria-hidden />Bank transfer</li>
          <li className="rounded-xl bg-canvas p-3"><Smartphone className="mx-auto mb-1 h-5 w-5 text-teal" aria-hidden />USSD</li>
        </ul>
        <div className="mt-6 space-y-3">
          <Alert tone="info" title="Online payment opens in the next update">Your application is saved. You’ll be able to pay here very soon.</Alert>
          <Button size="lg" className="w-full" disabled>Pay {formatNaira(base + processing)}</Button>
          {isApplicationFee && <ButtonLink href="/portal/apply?step=8" variant="ghost" size="lg" className="w-full">Back to review</ButtonLink>}
        </div>
      </Card>
    </div>
  )
}
