import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, BookOpen, CalendarCheck2, ClipboardCheck, Download, MapPin, Megaphone, Receipt, Wallet } from 'lucide-react'
import { Badge, ButtonLink, Card, CardHeader, StatCard, buttonClass } from '@/components/ui'
import { createClient } from '@/lib/supabase/server'
import { attendanceSummary, getAnnouncements, getCohortSessions, getMyAttendance, getMyEnrolment, getMyResult } from '@/lib/portal/queries'
import { FORMAT } from '@/lib/programmes'
import { site } from '@/lib/site'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Dashboard' }

const lagosDay = (d: Date) => new Date(d.toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })).getTime()
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { timeZone: 'Africa/Lagos', weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', hour12: true })

export default async function StudentDashboard({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/portal')
  const enrolment = await getMyEnrolment(supabase, user.id)
  // Until someone is admitted, their home is their application.
  if (!enrolment) redirect((await searchParams).saved ? '/portal/apply?saved=1' : '/portal/apply')

  const [{ data: profile }, sessions, marks, result, announcements] = await Promise.all([
    supabase.from('profiles').select('first_name').eq('id', user.id).single(),
    getCohortSessions(supabase, enrolment.cohort.id),
    getMyAttendance(supabase, enrolment.id),
    getMyResult(supabase, enrolment.id),
    getAnnouncements(supabase, 4),
  ])
  const att = attendanceSummary(sessions, marks)
  const upcoming = sessions.filter((s) => new Date(s.ends_at) >= new Date()).slice(0, 3)
  const p = enrolment.programme
  const start = new Date(`${enrolment.cohort.start_date}T09:00:00+01:00`)
  const end = new Date(`${enrolment.cohort.end_date}T16:00:00+01:00`)
  const now = new Date()
  const daysToStart = Math.round((lagosDay(start) - lagosDay(now)) / 86_400_000)
  const week = Math.min(FORMAT.durationWeeks, Math.max(1, Math.floor((lagosDay(now) - lagosDay(start)) / (7 * 86_400_000)) + 1))
  const phase = now < start ? 'before' : now <= end ? 'during' : 'after'

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[1.75rem] font-bold leading-9 sm:text-h1">Welcome, {profile?.first_name || 'student'}</h1>
          <p className="mt-2 text-base text-ink-muted sm:text-lead">{p.shortTitle} · {enrolment.cohort.name}</p>
        </div>
        <Badge tone="navy" className="self-start sm:self-auto">{enrolment.reg_no}</Badge>
      </div>

      {/* Where the student is in the programme */}
      <Card className="mt-6 overflow-hidden border-0 bg-navy p-0 text-white">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="text-label font-semibold uppercase tracking-wide text-teal-100">
              {phase === 'before' ? 'Classes start soon' : phase === 'during' ? `Week ${week} of ${FORMAT.durationWeeks}` : 'Programme completed'}
            </p>
            <h2 className="mt-2 text-[1.375rem] font-semibold leading-8 text-white">
              {phase === 'before'
                ? daysToStart === 0 ? 'Your first class is today' : `${daysToStart} day${daysToStart === 1 ? '' : 's'} to your first class`
                : phase === 'during'
                  ? upcoming[0] ? upcoming[0].title : 'Classes are under way'
                  : result?.published_at ? 'Your results are out' : 'Results are being finalised'}
            </h2>
            <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-base text-white/85">
              <span className="flex items-center gap-2"><CalendarCheck2 className="h-5 w-5" aria-hidden />{phase === 'during' && upcoming[0] ? when(upcoming[0].starts_at) : `${FORMAT.schedule}, from ${formatDate(enrolment.cohort.start_date)}`}</span>
              <span className="flex items-center gap-2"><MapPin className="h-5 w-5" aria-hidden />{upcoming[0]?.venue || enrolment.cohort.venue || site.venue.value}</span>
            </p>
          </div>
          <ButtonLink href={phase === 'after' ? '/portal/results' : '/portal/schedule'} variant="light" className="self-start sm:self-auto">
            {phase === 'after' ? 'View results' : 'View timetable'}
          </ButtonLink>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<BookOpen className="h-6 w-6" />} value={String(p.modules.length)} label="Modules" hint="Plus a capstone project" />
        <StatCard icon={<ClipboardCheck className="h-6 w-6" />} value={att.pct === null ? '—' : `${att.pct}%`} label="Attendance" tone="success" hint="If your intake records it" />
        <StatCard icon={<CalendarCheck2 className="h-6 w-6" />} value={`${att.held}/${sessions.length || FORMAT.durationWeeks}`} label="Sessions held" tone="navy" />
        <StatCard icon={<Wallet className="h-6 w-6" />} value="₦0" label="Balance due" tone="success" hint="Tuition paid" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="Coming up" action={<Link href="/portal/schedule" className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-teal hover:underline">Timetable <ArrowRight className="h-4 w-4" aria-hidden /></Link>} />
            {upcoming.length === 0 ? (
              <p className="rounded-xl bg-canvas p-4 text-base text-ink-muted">{phase === 'after' ? 'There are no more classes in this programme.' : 'The timetable is published before the first class. You’ll see each Saturday’s session here.'}</p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((s) => (
                  <li key={s.id} className="rounded-xl border-l-4 border-l-teal bg-teal-50 p-4">
                    <p className="font-semibold text-navy">{s.title}</p>
                    <p className="text-sm text-ink-muted">{when(s.starts_at)}{s.modules ? ` · Module ${s.modules.number}` : ''}{s.venue ? ` · ${s.venue}` : ''}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Your modules" action={<Link href="/portal/programme" className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-teal hover:underline">Details <ArrowRight className="h-4 w-4" aria-hidden /></Link>} />
            <ol className="space-y-3">
              {p.modules.map((m) => (
                <li key={m.number} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy font-display text-sm font-bold text-white">{m.number}</span>
                  <div><p className="font-semibold text-navy">{m.title}</p><p className="text-sm text-ink-muted">Weeks {m.number * 2 - 1}–{m.number * 2}</p></div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-h3 font-semibold">Your documents</h2>
            <div className="mt-4 space-y-3">
              <a href={`/portal/admission-letter/${enrolment.application_id}`} download className={buttonClass('primary', 'md', 'w-full')}><Download className="h-5 w-5" aria-hidden /> Admission letter</a>
              <ButtonLink href="/portal/payments" variant="secondary" className="w-full"><Receipt className="h-5 w-5" aria-hidden /> Receipts</ButtonLink>
            </div>
          </Card>
          <Card>
            <h2 className="flex items-center gap-2 text-h3 font-semibold"><Megaphone className="h-5 w-5 text-teal" aria-hidden /> Announcements</h2>
            {announcements.length === 0 ? (
              <p className="mt-3 text-base text-ink-muted">No announcements yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {announcements.map((a) => (
                  <li key={a.id} className="py-3">
                    <p className="font-semibold text-navy">{a.title}</p>
                    <p className="mt-1 whitespace-pre-line text-base text-ink">{a.body}</p>
                    <p className="mt-1 text-sm text-ink-muted">{formatDate(a.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
