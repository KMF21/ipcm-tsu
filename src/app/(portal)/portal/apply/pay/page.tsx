import { redirect } from 'next/navigation'
import { CheckCircle2, CreditCard, FileText, Landmark, Smartphone } from 'lucide-react'
import { Alert, Badge, ButtonLink, Card } from '@/components/ui'
import { PayButton } from '@/components/apply/PayButton'
import { createClient } from '@/lib/supabase/server'
import { getMyApplication } from '@/lib/application/queries'
import { DOC_RULES } from '@/lib/application/steps'
import { FORMAT } from '@/lib/programmes'
import { formatDate, formatNaira } from '@/lib/utils'

export const metadata = { title: 'Payment' }

export default async function PayPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/portal/apply/pay')
  const app = await getMyApplication(supabase, user.id)
  if (!app) redirect('/portal/apply')

  const isApplicationFee = app.status === 'draft'
  const isTuition = app.status === 'offered'
  if (isApplicationFee && app.application_fee_paid_at) redirect('/portal/apply?step=2')
  if (!isApplicationFee && !isTuition) redirect('/portal/apply')

  const { data: fee } = await supabase
    .from('fee_items')
    .select('base_amount_kobo, processing_fee_kobo')
    .eq('programme_id', app.programme_id)
    .eq('type', isApplicationFee ? 'application' : 'tuition')
    .single()
  const { data: tuitionFee } = await supabase
    .from('fee_items')
    .select('base_amount_kobo, processing_fee_kobo')
    .eq('programme_id', app.programme_id)
    .eq('type', 'tuition')
    .single()
  const tuitionTotal = (tuitionFee?.base_amount_kobo ?? 0) + (tuitionFee?.processing_fee_kobo ?? 0)
  const base = fee?.base_amount_kobo ?? 0
  const processing = fee?.processing_fee_kobo ?? 0
  const total = base + processing

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-label font-semibold uppercase tracking-wide text-teal">{isApplicationFee ? 'Before you continue' : 'Secure your seat'}</p>
        <Badge tone="navy">{app.ref}</Badge>
      </div>
      <h1 className="mt-2 text-[1.75rem] font-bold leading-9 sm:text-h1">{isApplicationFee ? 'Check and pay the application fee' : 'Pay your tuition'}</h1>
      <p className="mt-2 text-base text-ink-muted">
        {app.programmes?.code} · {app.programmes?.short_title}
        {app.cohorts ? ` · ${app.cohorts.name}` : ''}
      </p>

      <div className="mt-6 space-y-3">
        {sp.pending && <Alert tone="info" title="We’re confirming your payment">This usually takes under a minute. Refresh this page shortly. If money left your account, it will be confirmed automatically; you won’t be charged twice.</Alert>}
        {sp.failed && <Alert tone="error" title="The payment didn’t go through">No money was taken, or it will be reversed by your bank. You can try again below.</Alert>}
        {sp.cancelled && <Alert tone="warning" title="Payment cancelled">You can pay whenever you’re ready.</Alert>}
      </div>

      {isApplicationFee && (
        <Card className="mt-6">
          <h2 className="text-h3 font-semibold">Can you apply? Check before paying</h2>
          <p className="mt-1 text-base text-ink-muted">The application fee is not refundable, so make sure you meet the requirements and have your documents ready.</p>
          <h3 className="mt-6 text-lg font-semibold">Entry requirements (one of these)</h3>
          <ul className="mt-3 space-y-2.5">
            {FORMAT.entry.map((e) => (
              <li key={e} className="flex gap-3 text-base text-ink"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />{e}</li>
            ))}
          </ul>
          <h3 className="mt-6 text-lg font-semibold">Documents you’ll upload</h3>
          <ul className="mt-3 space-y-2.5">
            {(['passport_photo', 'qualification', 'identification'] as const).map((t) => (
              <li key={t} className="flex gap-3 text-base text-ink"><FileText className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />{DOC_RULES[t].label}</li>
            ))}
            <li className="flex gap-3 text-base text-ink-muted"><FileText className="mt-0.5 h-5 w-5 shrink-0 text-ink-muted" aria-hidden />CV, if applying as a mature entrant (25+)</li>
            <li className="flex gap-3 text-base text-ink-muted"><FileText className="mt-0.5 h-5 w-5 shrink-0 text-ink-muted" aria-hidden />Sponsorship letter, if your organisation is paying</li>
          </ul>
          <h3 className="mt-6 text-lg font-semibold">What happens next</h3>
          <ol className="mt-3 space-y-2 text-base text-ink">
            <li>1. Pay the application fee below.</li>
            <li>2. Complete your details and upload your documents. Your progress saves as you go.</li>
            <li>3. Submit your application (no extra charge). We review it and send you an offer.</li>
            <li>4. Pay tuition ({formatNaira(tuitionTotal)}) after you receive an offer.</li>
          </ol>
          {app.cohorts && <p className="mt-4 text-base text-ink-muted">Apply by <strong className="text-navy">{formatDate(app.cohorts.application_deadline)}</strong>. Classes start {formatDate(app.cohorts.start_date)}, {FORMAT.schedule.toLowerCase()}.</p>}
        </Card>
      )}

      <Card className="mt-6">
        <h2 className="text-h3 font-semibold">{isApplicationFee ? 'Application fee' : 'Tuition'}</h2>
        <dl className="mt-4 space-y-3 text-base">
          <div className="flex justify-between gap-4"><dt className="text-ink-muted">{app.programmes?.code} {isApplicationFee ? 'application fee' : 'tuition'}</dt><dd className="font-semibold text-navy">{formatNaira(base)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-ink-muted">Processing charge</dt><dd className="font-semibold text-navy">{formatNaira(processing)}</dd></div>
          <div className="flex justify-between gap-4 border-t border-line pt-3 text-lg"><dt className="font-semibold text-navy">Total</dt><dd className="font-display font-bold text-navy">{formatNaira(total)}</dd></div>
        </dl>
        <ul className="mt-6 grid grid-cols-3 gap-2 text-center text-sm text-ink-muted">
          <li className="rounded-xl bg-canvas p-3"><CreditCard className="mx-auto mb-1 h-5 w-5 text-teal" aria-hidden />Card</li>
          <li className="rounded-xl bg-canvas p-3"><Landmark className="mx-auto mb-1 h-5 w-5 text-teal" aria-hidden />Bank transfer</li>
          <li className="rounded-xl bg-canvas p-3"><Smartphone className="mx-auto mb-1 h-5 w-5 text-teal" aria-hidden />USSD</li>
        </ul>
        <div className="mt-6 space-y-3">
          <PayButton feeType={isApplicationFee ? 'application' : 'tuition'} label={`Pay ${formatNaira(total)}`} />
          {isApplicationFee && <ButtonLink href="/portal/apply?step=1" variant="ghost" size="lg" className="w-full">Change programme or intake</ButtonLink>}
        </div>
      </Card>
    </div>
  )
}
