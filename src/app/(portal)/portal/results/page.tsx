import { redirect } from 'next/navigation'
import { Award } from 'lucide-react'
import { EmptyState } from '@/components/ui'
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
  const r = await getMyResult(supabase, enrolment.id)

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
            <div className="rounded-xl bg-canvas p-4"><dt className="text-sm text-ink-muted">Overall score</dt><dd className="font-display text-xl font-bold text-navy">{r.total_pct ?? '—'}%</dd></div>
            <div className="rounded-xl bg-canvas p-4"><dt className="text-sm text-ink-muted">Attendance</dt><dd className="font-display text-xl font-bold text-navy">{r.attendance_pct ?? '—'}%</dd></div>
          </dl>
          {r.classification !== 'Fail' && <p className="mt-6 text-base text-ink">Congratulations. Your certificate will be issued by the University and will appear in your portal.</p>}
        </div>
      )}
    </div>
  )
}
