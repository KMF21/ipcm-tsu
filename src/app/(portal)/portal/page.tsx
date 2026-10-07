import Link from 'next/link'
import { ArrowRight, BookOpen, CalendarCheck2, ClipboardCheck, MapPin, Megaphone, Percent, Wallet } from 'lucide-react'
import { Alert, Badge, ButtonLink, Card, CardHeader, ProgressBar, StatCard, StatusPill } from '@/components/ui'
import { demoAnnouncements, demoModules, demoSessions, demoStudent, demoWeek } from '@/lib/demo'
import { cn } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const sessionTone: Record<string, string> = {
  teal: 'border-l-teal bg-teal-50',
  amber: 'border-l-amber bg-amber-50',
  navy: 'border-l-navy bg-navy-50',
  success: 'border-l-success bg-success-50',
  neutral: 'border-l-line bg-canvas',
}

export default async function StudentDashboard({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  // Until someone is admitted, their home is their application. Admitted students see the dashboard.
  // (In preview mode with no session, the demo dashboard is shown for design review.)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: enrolment } = await supabase.from('enrolments').select('id').eq('user_id', user.id).limit(1).maybeSingle()
    if (!enrolment) redirect((await searchParams).saved ? '/portal/apply?saved=1' : '/portal/apply')
  }
  return (
    <div className="mx-auto max-w-[1400px]">
      <Alert tone="info" title="Design preview">
        This dashboard uses sample data. It connects to your real records in Phase 2.
      </Alert>

      {/* Greeting */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[1.75rem] font-bold leading-9 sm:text-h1">Welcome back, {demoStudent.firstName}</h1>
          <p className="mt-2 text-base text-ink-muted sm:text-lead">
            {demoStudent.programme} · {demoStudent.cohort}
          </p>
        </div>
        <Badge tone="navy" className="self-start sm:self-auto">{demoStudent.regNo}</Badge>
      </div>

      {/* Stat cards: 2x2 on phone, 4 across on desktop */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<BookOpen className="h-6 w-6" />} value="1/4" label="Modules completed" />
        <StatCard icon={<ClipboardCheck className="h-6 w-6" />} value="100%" label="Attendance" tone="success" hint="Minimum 75%" />
        <StatCard icon={<Percent className="h-6 w-6" />} value="80%" label="Current score" tone="navy" />
        <StatCard icon={<Wallet className="h-6 w-6" />} value="₦0" label="Balance due" tone="success" hint="Fully paid" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          {/* Next session: the one obvious next action */}
          <Card className="overflow-hidden border-0 bg-navy p-0 text-white">
            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div>
                <p className="text-label font-semibold uppercase tracking-wide text-teal-100">Next session</p>
                <h2 className="mt-2 text-[1.375rem] font-semibold leading-8 text-white">Module 2 · The mediation process</h2>
                <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-base text-white/85">
                  <span className="flex items-center gap-2"><CalendarCheck2 className="h-5 w-5" aria-hidden /> Saturday 6 March, 9:00am</span>
                  <span className="flex items-center gap-2"><MapPin className="h-5 w-5" aria-hidden /> IPCM Lecture Hall</span>
                </p>
              </div>
              <ButtonLink href="/portal/programme" variant="light" className="shrink-0">Prepare for class</ButtonLink>
            </div>
          </Card>

          {/* Modules */}
          <Card>
            <CardHeader title="My modules" subtitle="Two Saturdays per module" action={<Link href="/portal/programme" className="hidden min-h-[44px] items-center gap-1 font-semibold text-teal sm:flex">View all <ArrowRight className="h-4 w-4" aria-hidden /></Link>} />

            {/* Module cards: one column on phones, two from tablet up */}
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {demoModules.map((m) => (
                <li key={m.n} className="flex flex-col rounded-xl border border-line p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-navy">{m.n}. {m.title}</p>
                    <span className="shrink-0 font-semibold text-navy">{m.score}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{m.facilitator}</p>
                  <div className="mt-4"><ProgressBar value={m.progress} label="Progress" tone={m.progress === 100 ? 'success' : 'teal'} /></div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <StatusPill status={m.status} />
                    <span className="whitespace-nowrap text-sm text-ink-muted">Weeks {m.n * 2 - 1}–{m.n * 2}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* Announcements */}
          <Card>
            <CardHeader title="Announcements" />
            <ul className="divide-y divide-line">
              {demoAnnouncements.map((a) => (
                <li key={a.title} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal"><Megaphone className="h-5 w-5" aria-hidden /></span>
                  <div>
                    <p className="font-semibold text-navy">{a.title}</p>
                    <p className="text-sm text-ink-muted">{a.when}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Schedule column */}
        <Card className="h-fit">
          <CardHeader title="Class schedule" subtitle="Saturday 6 March · 5 items" />
          <div className="grid grid-cols-7 gap-1.5" role="list" aria-label="This week">
            {demoWeek.map((d) => (
              <div
                key={d.iso}
                role="listitem"
                className={cn(
                  'flex flex-col items-center rounded-xl border py-2.5',
                  d.active ? 'border-teal bg-teal text-white' : 'border-line text-ink',
                )}
                aria-current={d.active ? 'date' : undefined}
              >
                <span className="text-lg font-bold">{d.date}</span>
                <span className={cn('text-sm', d.active ? 'text-white/90' : 'text-ink-muted')}>{d.day}</span>
              </div>
            ))}
          </div>
          <ol className="mt-5 space-y-3">
            {demoSessions.map((s) => (
              <li key={s.title} className="flex gap-4">
                <span className="w-[68px] shrink-0 pt-3 text-sm font-medium text-ink-muted">{s.time}</span>
                <div className={cn('flex-1 rounded-xl border-l-4 p-3.5', sessionTone[s.tone])}>
                  <p className="font-semibold leading-snug text-navy">{s.title}</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {s.time} – {s.end}{s.facilitator ? ` · ${s.facilitator}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  )
}
