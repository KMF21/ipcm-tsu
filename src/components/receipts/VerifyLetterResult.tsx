import { ShieldCheck, ShieldX } from 'lucide-react'
import { ButtonLink } from '@/components/ui'
import { formatDateTime } from '@/lib/receipts/types'
import { longDate, type LetterCheck } from '@/lib/letters/types'
import { site } from '@/lib/site'

/** What someone sees after scanning an admission letter's QR code. */
export function VerifyLetterResult({ r }: { r: LetterCheck | null }) {
  const valid = !!r?.valid
  return (
    <div className="container-page py-10 sm:py-16">
      <div className="mx-auto max-w-xl">
        <p className="text-label font-semibold uppercase tracking-wide text-teal">Admission letter verification</p>
        <h1 className="mt-2 text-[1.75rem] font-bold leading-9 text-navy sm:text-h1">{valid ? 'This admission is genuine' : 'We couldn’t verify this letter'}</h1>
        <div className={`mt-6 overflow-hidden rounded-2xl border bg-white shadow-card ${valid ? 'border-success/40' : 'border-crimson/40'}`}>
          <div className={`flex items-center gap-4 p-5 ${valid ? 'bg-success-50' : 'bg-crimson-50'}`}>
            {valid ? <ShieldCheck className="h-10 w-10 shrink-0 text-success" aria-hidden /> : <ShieldX className="h-10 w-10 shrink-0 text-crimson" aria-hidden />}
            <div>
              <p className={`text-lg font-bold ${valid ? 'text-success' : 'text-crimson'}`}>{valid ? 'Valid admission' : r ? 'No longer valid' : 'No matching letter'}</p>
              <p className="text-sm text-ink-muted">
                {valid
                  ? `Admitted by the ${site.name}, ${site.parent}.`
                  : r
                    ? 'This student’s admission was withdrawn or deferred, so the letter no longer applies.'
                    : 'The link or QR code doesn’t match any letter we issued. It may have been copied wrongly or altered.'}
              </p>
            </div>
          </div>
          {r && (
            <dl className="grid gap-4 p-5 sm:grid-cols-2">
              <div><dt className="text-sm text-ink-muted">Name</dt><dd className="text-base font-semibold text-ink">{r.name}</dd></div>
              <div><dt className="text-sm text-ink-muted">Registration number</dt><dd className="break-all text-base font-semibold text-ink">{r.reg_no}</dd></div>
              <div className="sm:col-span-2"><dt className="text-sm text-ink-muted">Programme</dt><dd className="text-base font-semibold text-ink">{r.programme_code}, {r.programme_title}</dd></div>
              <div><dt className="text-sm text-ink-muted">Intake</dt><dd className="text-base font-semibold text-ink">{r.cohort_name}</dd></div>
              <div><dt className="text-sm text-ink-muted">Admitted on</dt><dd className="text-base font-semibold text-ink">{longDate(r.admitted_at)}</dd></div>
            </dl>
          )}
        </div>
        <p className="mt-5 text-base text-ink-muted">
          {valid ? 'Compare these details with the letter. If the name, registration number or programme differs, the letter has been changed and should not be accepted.' : `If you believe this is a mistake, contact the Institute at ${site.email.value}.`}
        </p>
        <p className="mt-2 text-sm text-ink-muted">Checked {formatDateTime(new Date().toISOString())}.</p>
        <div className="mt-8"><ButtonLink href="/" variant="secondary">Go to the Institute’s website</ButtonLink></div>
      </div>
    </div>
  )
}
