import { redirect } from 'next/navigation'
import { Award, Download, ShieldCheck } from 'lucide-react'
import { EmptyState, buttonClass } from '@/components/ui'
import { PortalHeader } from '@/components/portal/PortalHeader'
import { NotYetStudent } from '@/components/portal/NotYetStudent'
import { createClient } from '@/lib/supabase/server'
import { getMyEnrolment, getMyResult } from '@/lib/portal/queries'
import { FORMAT } from '@/lib/programmes'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Results' }

export default async function ResultsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/portal/results')
  const enrolment = await getMyEnrolment(supabase, user.id)
  if (!enrolment) return <><PortalHeader title="Results" /><NotYetStudent what="results" /></>
  const [r, { data: cert }] = await Promise.all([
    getMyResult(supabase, enrolment.id),
    supabase.from('certificates').select('certificate_no, issued_at, collected_at, verify_hash').eq('enrolment_id', enrolment.id).is('revoked_at', null).maybeSingle(),
  ])

  return (
    <div className="mx-auto max-w-3xl">
      <PortalHeader title="Results" intro={FORMAT.award} />
      {!r?.published_at ? (
        <EmptyState illustration title="Results are not out yet" body={`Results are published after the programme ends on ${formatDate(enrolment.cohort.end_date)}, once the capstone projects are marked. We’ll email you.`} />
      ) : (
        <div className="rounded-card border border-line bg-white p-6 shadow-card sm:p-8">
          <div className="flex items-center gap-4">
            <span className={`flex h-14 w-14 items-center justify-center rounded-full ${r.classification === 'Fail' ? 'bg-crimson-50 text-crimson' : 'bg-success-50 text-success'}`}><Award className="h-7 w-7" aria-hidden /></span>
            <div>
              <p className="text-sm text-ink-muted">Published {formatDate(r.published_at)}</p>
              <p className="font-display text-h2 font-bold text-navy">{r.classification}</p>
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-canvas p-4"><dt className="text-sm text-ink-muted">Overall score</dt><dd className="font-display text-xl font-bold text-navy">{r.total_pct != null ? `${r.total_pct}%` : '—'}</dd></div>
            <div className="rounded-xl bg-canvas p-4"><dt className="text-sm text-ink-muted">Attendance</dt><dd className="font-display text-xl font-bold text-navy">{r.attendance_pct != null ? `${r.attendance_pct}%` : 'Not recorded'}</dd></div>
          </dl>
          <a href="/portal/results/statement" className={buttonClass('secondary', 'md', 'mt-6 w-full sm:w-auto')}><Download className="h-5 w-5" aria-hidden /> Statement of result (PDF)</a>
          {r.classification !== 'Fail' && (
            cert ? (
              <div className="mt-6 rounded-xl border border-success/40 bg-success-50 p-5">
                <p className="flex items-center gap-2 font-semibold text-success"><ShieldCheck className="h-5 w-5" aria-hidden /> Certificate issued</p>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div><dt className="text-sm text-ink-muted">Certificate number</dt><dd className="break-all font-mono font-semibold text-ink">{cert.certificate_no}</dd></div>
                  <div><dt className="text-sm text-ink-muted">Issued</dt><dd className="font-semibold text-ink">{formatDate(cert.issued_at)}</dd></div>
                </dl>
                <p className="mt-3 text-base text-ink">
                  {cert.collected_at
                    ? `Collected on ${formatDate(cert.collected_at)}.`
                    : 'The Institute will tell you when to collect it. Bring a valid means of identification.'}{' '}
                  Employers can check it by scanning its QR code or entering the number at <a href="/verify" className="font-semibold text-teal underline">our verification page</a>.
                </p>
              </div>
            ) : <p className="mt-6 text-base text-ink">Congratulations. Your certificate will be issued by the Institute, and we’ll email you when it’s ready.</p>
          )}
        </div>
      )}
    </div>
  )
}
