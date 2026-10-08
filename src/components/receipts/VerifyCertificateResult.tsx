import { ShieldCheck, ShieldX } from 'lucide-react'
import { ButtonLink } from '@/components/ui'
import { formatDateTime } from '@/lib/receipts/types'
import { longDate } from '@/lib/letters/types'
import type { CertificateCheck } from '@/lib/certificates/types'
import { site } from '@/lib/site'

/** What someone sees after scanning a certificate's QR code. */
export function VerifyCertificateResult({ r, photoUrl }: { r: CertificateCheck | null; photoUrl: string | null }) {
  const valid = !!r?.valid
  return (
    <div className="container-page py-10 sm:py-16">
      <div className="mx-auto max-w-xl">
        <p className="text-label font-semibold uppercase tracking-wide text-teal">Certificate verification</p>
        <h1 className="mt-2 text-[1.75rem] font-bold leading-9 text-navy sm:text-h1">{valid ? 'This certificate is genuine' : 'We couldn’t verify this certificate'}</h1>
        <div className={`mt-6 overflow-hidden rounded-2xl border bg-white shadow-card ${valid ? 'border-success/40' : 'border-crimson/40'}`}>
          <div className={`flex items-center gap-4 p-5 ${valid ? 'bg-success-50' : 'bg-crimson-50'}`}>
            {valid ? <ShieldCheck className="h-10 w-10 shrink-0 text-success" aria-hidden /> : <ShieldX className="h-10 w-10 shrink-0 text-crimson" aria-hidden />}
            <div>
              <p className={`text-lg font-bold ${valid ? 'text-success' : 'text-crimson'}`}>{valid ? 'Valid certificate' : r ? 'Revoked' : 'No matching certificate'}</p>
              <p className="text-sm text-ink-muted">
                {valid
                  ? `Awarded by the ${site.name}, ${site.parent}.`
                  : r
                    ? r.replaced_by
                      ? `This certificate was withdrawn on ${longDate(r.revoked_at!)} and replaced by certificate ${r.replaced_by}. Only the replacement is valid.`
                      : `This certificate was withdrawn by the Institute on ${longDate(r.revoked_at!)} and is no longer valid.`
                    : 'The QR code doesn’t match any certificate we issued. It may have been copied wrongly or altered.'}
              </p>
            </div>
          </div>
          {r && (
            <div className="flex flex-col gap-5 p-5 sm:flex-row">
              {valid && photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt={`Passport photograph on record for ${r.holder_name}`} className="h-36 w-28 shrink-0 self-start rounded-lg border border-line object-cover" />
              )}
              <dl className="grid flex-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><dt className="text-sm text-ink-muted">Awarded to</dt><dd className="text-lg font-semibold text-ink">{r.holder_name}</dd></div>
                <div><dt className="text-sm text-ink-muted">Certificate number</dt><dd className="break-all text-base font-semibold text-ink">{r.certificate_no}</dd></div>
                <div><dt className="text-sm text-ink-muted">Registration number</dt><dd className="break-all text-base font-semibold text-ink">{r.reg_no}</dd></div>
                <div className="sm:col-span-2"><dt className="text-sm text-ink-muted">Award</dt><dd className="text-base font-semibold text-ink">{r.programme_title}{r.classification === 'Distinction' ? ', with Distinction' : ''}</dd></div>
                <div><dt className="text-sm text-ink-muted">Intake</dt><dd className="text-base font-semibold text-ink">{r.cohort_name}</dd></div>
                <div><dt className="text-sm text-ink-muted">Awarded on</dt><dd className="text-base font-semibold text-ink">{longDate(r.issued_at)}</dd></div>
              </dl>
            </div>
          )}
        </div>
        <p className="mt-5 text-base text-ink-muted">
          {valid
            ? `Compare these details with the paper certificate${photoUrl ? ' and the photograph with the person presenting it' : ''}. If the name, number or award differs, the certificate has been altered and should not be accepted.`
            : `If you believe this is a mistake, contact the Institute at ${site.email.value}.`}
        </p>
        <p className="mt-2 text-sm text-ink-muted">Checked {formatDateTime(new Date().toISOString())}.</p>
        <div className="mt-8"><ButtonLink href="/verify" variant="secondary">Check another certificate</ButtonLink></div>
      </div>
    </div>
  )
}
