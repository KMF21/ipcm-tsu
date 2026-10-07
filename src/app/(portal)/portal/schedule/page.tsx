import { redirect } from 'next/navigation'
import { CalendarDays, MapPin, Video } from 'lucide-react'
import { EmptyState } from '@/components/ui'
import { PortalHeader } from '@/components/portal/PortalHeader'
import { NotYetStudent } from '@/components/portal/NotYetStudent'
import { createClient } from '@/lib/supabase/server'
import { attendanceSummary, getCohortSessions, getMyAttendance, getMyEnrolment } from '@/lib/portal/queries'
import { FORMAT } from '@/lib/programmes'
import { site } from '@/lib/site'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Timetable' }

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', weekday: 'long', day: 'numeric', month: 'long' })
const time = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Africa/Lagos', hour: 'numeric', minute: '2-digit', hour12: true })

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/portal/schedule')
  const enrolment = await getMyEnrolment(supabase, user.id)
  if (!enrolment) return <><PortalHeader title="Timetable" /><NotYetStudent what="timetable" /></>
  const [sessions, marks] = await Promise.all([getCohortSessions(supabase, enrolment.cohort.id), getMyAttendance(supabase, enrolment.id)])
  const { byId } = attendanceSummary(sessions, marks)
  const now = Date.now()

  return (
    <div className="mx-auto max-w-4xl">
      <PortalHeader eyebrow={enrolment.cohort.name} title="Timetable" intro={`${FORMAT.schedule}, ${formatDate(enrolment.cohort.start_date)} to ${formatDate(enrolment.cohort.end_date)}. Venue: ${enrolment.cohort.venue || site.venue.value}.`} />
      {sessions.length === 0 ? (
        <EmptyState illustration title="The timetable is on its way" body={`Each Saturday’s session will be listed here before classes start on ${formatDate(enrolment.cohort.start_date)}. We’ll also email you.`} />
      ) : (
        <ol className="space-y-3">
          {sessions.map((s) => {
            const past = new Date(s.ends_at).getTime() < now
            const mark = byId.get(s.id)
            return (
              <li key={s.id} className={`rounded-card border bg-white p-5 shadow-card ${past ? 'border-line opacity-80' : 'border-teal/40'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-teal">{s.modules ? `Module ${s.modules.number}` : 'Session'}</p>
                    <h2 className="text-lg font-semibold text-navy">{s.title}</h2>
                  </div>
                  {past && <span className={`rounded-full px-3 py-1 text-sm font-semibold ${mark === 'present' || mark === 'excused' ? 'bg-success-50 text-success' : mark === 'absent' ? 'bg-crimson-50 text-crimson' : 'bg-canvas text-ink-muted'}`}>{mark === 'present' ? 'Attended' : mark === 'excused' ? 'Excused' : mark === 'absent' ? 'Absent' : 'Not marked'}</span>}
                </div>
                <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-base text-ink-muted">
                  <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" aria-hidden />{day(s.starts_at)}, {time(s.starts_at)} to {time(s.ends_at)}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden />{s.venue || enrolment.cohort.venue || site.venue.value}</span>
                  {s.online_url && <a href={s.online_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-semibold text-teal"><Video className="h-4 w-4" aria-hidden />Join online</a>}
                </p>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
