import { redirect } from 'next/navigation'
import { EmptyState, ProgressBar } from '@/components/ui'
import { PortalHeader } from '@/components/portal/PortalHeader'
import { NotYetStudent } from '@/components/portal/NotYetStudent'
import { createClient } from '@/lib/supabase/server'
import { attendanceSummary, getCohortSessions, getMyAttendance, getMyEnrolment } from '@/lib/portal/queries'

export const metadata = { title: 'Attendance' }

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', weekday: 'short', day: 'numeric', month: 'short' })

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/portal/attendance')
  const enrolment = await getMyEnrolment(supabase, user.id)
  if (!enrolment) return <><PortalHeader title="Attendance" /><NotYetStudent what="attendance" /></>
  const [sessions, marks] = await Promise.all([getCohortSessions(supabase, enrolment.cohort.id), getMyAttendance(supabase, enrolment.id)])
  const a = attendanceSummary(sessions, marks)
  const held = sessions.filter((s) => new Date(s.ends_at) < new Date())

  return (
    <div className="mx-auto max-w-3xl">
      <PortalHeader title="Attendance" intro="You need at least 75% attendance to receive the certificate. Facilitators mark attendance at each session." />
      {a.held === 0 ? (
        <EmptyState illustration title="No sessions held yet" body="Your attendance appears here after the first class." />
      ) : (
        <>
          <div className="rounded-card border border-line bg-white p-6 shadow-card">
            <p className="font-display text-stat font-bold text-navy">{a.pct}%</p>
            <p className="text-base text-ink-muted">{a.attended} of {a.held} sessions attended</p>
            <div className="mt-4"><ProgressBar value={a.pct ?? 0} label="Attendance" tone={(a.pct ?? 0) >= 75 ? 'success' : 'amber'} /></div>
            {(a.pct ?? 0) < 75 && <p className="mt-3 text-base font-semibold text-amber">Below 75%. Speak to your facilitator about catching up.</p>}
          </div>
          <ul className="mt-6 divide-y divide-line rounded-card border border-line bg-white">
            {held.map((s) => {
              const m = a.byId.get(s.id)
              return (
                <li key={s.id} className="flex min-h-[60px] items-center justify-between gap-3 px-5 py-3">
                  <div><p className="font-semibold text-navy">{s.title}</p><p className="text-sm text-ink-muted">{day(s.starts_at)}</p></div>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${m === 'present' || m === 'excused' ? 'bg-success-50 text-success' : m === 'absent' ? 'bg-crimson-50 text-crimson' : 'bg-canvas text-ink-muted'}`}>{m === 'present' ? 'Present' : m === 'excused' ? 'Excused' : m === 'absent' ? 'Absent' : 'Not marked'}</span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
