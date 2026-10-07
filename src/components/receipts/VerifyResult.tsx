import { ShieldCheck, ShieldX } from 'lucide-react'
import { ButtonLink } from '@/components/ui'
import { FEE_LABEL, formatDateTime, type ReceiptCheck } from '@/lib/receipts/types'
import { formatNaira } from '@/lib/utils'
import { site } from '@/lib/site'

/** What someone sees after scanning a receipt's QR code. */
export function VerifyResult({ r }: { r: ReceiptCheck | null }) {
  const valid = !!r?.valid
  const checkedAt = formatDateTime(new Date().toISOString())

  return (
    <div className="container-page py-10 sm:py-16">
      <div className="mx-auto max-w-xl">
        <p className="text-label font-semibold uppercase tracking-wide text-teal">Receipt verification</p>
        <h1 className="mt-2 text-[1.75rem] font-bold leading-9 text-navy sm:text-h1">
          {valid ? 'This receipt is genuine' : 'We couldn’t verify this receipt'}
        </h1>

        <div className={`mt-6 overflow-hidden rounded-2xl border bg-white shadow-card ${valid ? 'border-success/40' : 'border-crimson/40'}`}>
          <div className={`flex items-center gap-4 p-5 ${valid ? 'bg-success-50' : 'bg-crimson-50'}`}>
            {valid ? <ShieldCheck className="h-10 w-10 shrink-0 text-success" aria-hidden /> : <ShieldX className="h-10 w-10 shrink-0 text-crimson" aria-hidden />}
            <div>
              <p className={`text-lg font-bold ${valid ? 'text-success' : 'text-crimson'}`}>{valid ? 'Valid receipt' : r ? 'Not valid' : 'No matching receipt'}</p>
              <p className="text-sm text-ink-muted">
                {valid
                  ? `Issued by the ${site.name}, ${site.parent}.`
                  : r
                    ? 'This payment was reversed or cancelled, so the receipt no longer counts as proof of payment.'
                    : 'The link or QR code doesn’t match any receipt we issued. It may have been copied wrongly or altered.'}
              </p>
            </div>
          </div>

          {r && (
            <dl className="grid gap-4 p-5 sm:grid-cols-2">
              <div><dt className="text-sm text-ink-muted">Receipt number</dt><dd className="text-base font-semibold text-ink">{r.receipt_no}</dd></div>
              <div><dt className="text-sm text-ink-muted">Amount</dt><dd className="font-display text-lg font-bold text-navy">{formatNaira(r.amount_kobo)}</dd></div>
              <div><dt className="text-sm text-ink-muted">Paid by</dt><dd className="text-base font-semibold text-ink">{r.payer_name}</dd></div>
              <div><dt className="text-sm text-ink-muted">Paid for</dt><dd className="text-base font-semibold text-ink">{FEE_LABEL[r.fee_type]}, {r.programme_code}</dd></div>
              <div className="sm:col-span-2"><dt className="text-sm text-ink-muted">Programme</dt><dd className="text-base font-semibold text-ink">{r.programme_title}{r.cohort_name ? ` · ${r.cohort_name}` : ''}</dd></div>
              {r.paid_at && <div className="sm:col-span-2"><dt className="text-sm text-ink-muted">Date paid</dt><dd className="text-base font-semibold text-ink">{formatDateTime(r.paid_at)}</dd></div>}
            </dl>
          )}
        </div>

        <p className="mt-5 text-base text-ink-muted">
          {valid
            ? 'Compare these details with the printed receipt. If anything differs (name, amount or receipt number), the printed copy has been changed and should not be accepted.'
            : `If you believe this is a mistake, contact the Institute at ${site.email.value}.`}
        </p>
        <p className="mt-2 text-sm text-ink-muted">Checked {checkedAt}.</p>
        <div className="mt-8">
          <ButtonLink href="/" variant="secondary">Go to the Institute’s website</ButtonLink>
        </div>
      </div>
    </div>
  )
}
