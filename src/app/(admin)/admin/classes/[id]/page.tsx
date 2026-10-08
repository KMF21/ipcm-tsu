import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, Mail, Phone, Trash2, UserMinus, UserPlus } from 'lucide-react'
import { Alert, Badge, Button, Card, EmptyState, Select } from '@/components/ui'
import { PageHeader, Tabs } from '@/components/admin/bits'
import { AnnouncementForm, AttendanceForm, ClassSettingsForm, ResultsActions, ScoreRow, SessionForm } from '@/components/admin/ClassForms'
import { canSeeClass, getClass } from '@/lib/admin/classes'
import { deleteAnnouncement, deleteSession, setFacilitator, setWaiver } from '@/lib/admin/class-actions'
import { can } from '@/lib/admin/roles'
import { requireStaff } from '@/lib/admin/session'
import { formatDateTime } from '@/lib/receipts/types'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Class' }

const lagos = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleString('en-GB', { timeZone: 'Africa/Lagos', ...o })
const TABS = ['overview', 'timetable', 'attendance', 'scores', 'results', 'announcements'] as const

export default async function ClassPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; session?: string }> }) {
  const { id } = await params
  const sp = await searchParams
  const { supabase, staff } = await requireStaff(can.classes)
  if (!(await canSeeClass(supabase, staff, id))) notFound()
  const k = await getClass(supabase, id)
  if (!k) notFound()
  const director = can.runClasses(staff.role)
  const tab = (TABS as readonly string[]).includes(sp.tab ?? '') ? sp.tab! : 'overview'
  const c = k.cohort
  const published = k.results.some((r) => r.published_at)
  const base = `/admin/classes/${id}`
  const scoreOf = (e: string, comp: string, mod: string | null = null) => k.scores.find((x) => x.enrolment_id === e && x.component === comp && x.module_id === mod)?.score

  let body: React.ReactNode = null
  if (tab === 'overview') {
    const { data: facultyPool } = director ? await supabase.from('profiles').select('id, first_name, surname, email').in('role', ['facilitator', 'director', 'super_admin']).eq('is_active', true).order('surname') : { data: [] }
    const assigned = new Set(k.facilitators.map((f) => f.user_id))
    body = (
      <div className="grid gap-6 lg:grid-cols-2">
        {director && <Card className="lg:col-span-2"><h2 className="mb-4 text-h3 font-semibold">Class settings</h2><ClassSettingsForm cohortId={id} mode={c.attendance_mode} min={c.min_attendance_pct} group={c.class_group_url} materials={c.materials_url} /></Card>}
        {!director && (
          <Card className="lg:col-span-2">
            <h2 className="text-h3 font-semibold">Class links</h2>
            <p className="mt-2 text-base text-ink">{c.class_group_url ? <a className="font-semibold text-teal" href={c.class_group_url} target="_blank" rel="noreferrer">WhatsApp group</a> : 'No class group link yet.'}{c.materials_url && <> · <a className="font-semibold text-teal" href={c.materials_url} target="_blank" rel="noreferrer">Materials folder</a></>}</p>
            <p className="mt-1 text-sm text-ink-muted">Attendance: {c.attendance_mode === 'off' ? 'not tracked' : c.attendance_mode === 'info' ? 'for information only' : `required (${c.min_attendance_pct ?? 0}%)`}</p>
          </Card>
        )}
        <Card>
          <h2 className="text-h3 font-semibold">Facilitators</h2>
          <ul className="mt-3 divide-y divide-line">
            {k.facilitators.length === 0 && <li className="py-2 text-base text-ink-muted">No one assigned yet.</li>}
            {k.facilitators.map((f) => (
              <li key={f.user_id} className="flex items-center justify-between gap-3 py-2.5">
                <div><p className="font-semibold text-navy">{f.name}</p><p className="text-sm text-ink-muted">{f.email}</p></div>
                {director && <form action={setFacilitator}><input type="hidden" name="cohort_id" value={id} /><input type="hidden" name="user_id" value={f.user_id} /><input type="hidden" name="op" value="remove" /><Button type="submit" variant="ghost" aria-label={`Remove ${f.name}`}><UserMinus className="h-4 w-4" aria-hidden /></Button></form>}
              </li>
            ))}
          </ul>
          {director && (
            <form action={setFacilitator} className="mt-4 flex gap-2">
              <input type="hidden" name="cohort_id" value={id} />
              <label className="sr-only" htmlFor="fac-add">Facilitator</label>
              <Select id="fac-add" name="user_id" defaultValue="" className="flex-1" required>
                <option value="" disabled>Add a facilitator…</option>
                {(facultyPool ?? []).filter((p) => !assigned.has(p.id)).map((p) => <option key={p.id} value={p.id}>{[p.first_name, p.surname].filter(Boolean).join(' ') || p.email}</option>)}
              </Select>
              <Button type="submit" variant="secondary"><UserPlus className="h-4 w-4" aria-hidden /> Add</Button>
            </form>
          )}
          {director && <p className="mt-2 text-sm text-ink-muted">Facilitators are staff accounts with the Facilitator role (add them under Staff accounts).</p>}
        </Card>
        <Card>
          <h2 className="text-h3 font-semibold">{k.students.length} student{k.students.length === 1 ? '' : 's'}</h2>
          <ul className="mt-3 divide-y divide-line">
            {k.students.map((s) => (
              <li key={s.id} className="py-2.5">
                <p className="font-semibold text-navy">{s.name}</p>
                <p className="flex flex-wrap gap-x-4 text-sm text-ink-muted">
                  <span>{s.reg_no}</span>
                  {s.phone && <a href={`tel:${s.phone}`} className="inline-flex items-center gap-1 text-teal"><Phone className="h-3.5 w-3.5" aria-hidden />{s.phone}</a>}
                  <a href={`mailto:${s.email}`} className="inline-flex items-center gap-1 text-teal"><Mail className="h-3.5 w-3.5" aria-hidden />Email</a>
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    )
  } else if (tab === 'timetable') {
    body = (
      <div className="space-y-4">
        <Alert tone="info" title="The timetable is optional">Add sessions whenever they are ready. Students see the intake start date until then, and nothing else depends on it.</Alert>
        {director && <details className="rounded-card border border-dashed border-teal/50 bg-white"><summary className="flex min-h-[56px] cursor-pointer list-none items-center px-5 font-semibold text-teal [&::-webkit-details-marker]:hidden">+ Add a session</summary><div className="border-t border-line p-5"><SessionForm cohortId={id} modules={k.modules} /></div></details>}
        {k.sessions.length === 0 ? <p className="rounded-card border border-line bg-white p-5 text-base text-ink-muted">No sessions yet.</p> : (
          <ul className="divide-y divide-line rounded-card border border-line bg-white shadow-card">
            {k.sessions.map((s) => (
              <li key={s.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy">{s.title}</p>
                    <p className="text-sm text-ink-muted">{lagos(s.starts_at, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })} – {lagos(s.ends_at, { hour: 'numeric', minute: '2-digit', hour12: true })}{s.venue ? ` · ${s.venue}` : ''}</p>
                  </div>
                  {director && <form action={deleteSession}><input type="hidden" name="cohort_id" value={id} /><input type="hidden" name="id" value={s.id} /><Button type="submit" variant="ghost" className="text-crimson"><Trash2 className="h-4 w-4" aria-hidden /> Remove</Button></form>}
                </div>
                {director && (
                  <details className="mt-3 rounded-xl border border-line"><summary className="flex min-h-[44px] cursor-pointer list-none items-center px-4 font-semibold text-teal [&::-webkit-details-marker]:hidden">Edit</summary>
                    <div className="border-t border-line p-4"><SessionForm cohortId={id} modules={k.modules} defaults={{ id: s.id, title: s.title, module_id: s.module_id, venue: s.venue, date: new Date(s.starts_at).toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' }), start: lagos(s.starts_at, { hour: '2-digit', minute: '2-digit', hour12: false }), end: lagos(s.ends_at, { hour: '2-digit', minute: '2-digit', hour12: false }) }} /></div>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  } else if (tab === 'attendance') {
    if (c.attendance_mode === 'off') {
      body = <EmptyState title="Attendance is switched off for this class" body={director ? 'Nothing needs marking. To track it, change Attendance under Overview → Class settings.' : 'Nothing needs marking. The Director can switch it on if needed.'} />
    } else if (k.sessions.length === 0) {
      body = <EmptyState title="Add a session first" body="Attendance is marked per session. Add sessions under Timetable (even just the date of each Saturday)." />
    } else {
      const sel = k.sessions.find((s) => s.id === sp.session) ?? [...k.sessions].reverse().find((s) => new Date(s.starts_at) <= new Date()) ?? k.sessions[0]
      const marks = Object.fromEntries(k.attendance.filter((a) => a.session_id === sel.id).map((a) => [a.enrolment_id, a.mark]))
      body = (
        <div className="space-y-4">
          <nav aria-label="Sessions" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <ul className="flex min-w-max gap-2">
              {k.sessions.map((s) => (
                <li key={s.id}><Link href={`${base}?tab=attendance&session=${s.id}`} className={`inline-flex min-h-[44px] items-center rounded-full border px-4 text-sm font-semibold ${s.id === sel.id ? 'border-teal bg-teal text-white' : 'border-line bg-white text-navy hover:border-teal'}`}>{lagos(s.starts_at, { day: 'numeric', month: 'short' })}</Link></li>
              ))}
            </ul>
          </nav>
          <p className="text-base text-ink"><strong className="text-navy">{sel.title}</strong> · {lagos(sel.starts_at, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <AttendanceForm key={sel.id} cohortId={id} sessionId={sel.id} students={k.students} marks={marks} />
        </div>
      )
    }
  } else if (tab === 'scores') {
    body = (
      <div className="space-y-4">
        <Alert tone={published ? 'warning' : 'info'} title={published ? 'Results are published, so scores are locked' : 'Enter scores out of 100'}>
          {published ? (director ? 'Unpublish results under Results to make corrections.' : 'Ask the Director to unpublish results if a score needs correcting.') : 'Leave a box empty if there is no score yet. Save each student’s row; you can come back any time before results are published.'}
        </Alert>
        <ul className="divide-y divide-line rounded-card border border-line bg-white shadow-card">
          {k.students.map((s) => (
            <ScoreRow key={s.id} cohortId={id} student={s} modules={k.modules} locked={published && !director}
              values={{ ...Object.fromEntries(k.modules.map((m) => [m.id, scoreOf(s.id, 'module', m.id)])), capstone: scoreOf(s.id, 'capstone') }} />
          ))}
        </ul>
      </div>
    )
  } else if (tab === 'results') {
    const byE = new Map(k.results.map((r) => [r.enrolment_id, r]))
    body = (
      <div className="space-y-4">
        <Alert tone="info" title="How results are worked out">
          {c.attendance_mode === 'required'
            ? `Attendance 20%, modules 30%, capstone 50%, with at least ${c.min_attendance_pct ?? 0}% attendance unless waived. Pass at 50%, Distinction at 70%.`
            : 'Modules 37.5% and capstone 62.5% (attendance doesn’t count for this class). Pass at 50%, Distinction at 70%.'}
        </Alert>
        {director ? <ResultsActions cohortId={id} published={published} hasResults={k.results.length > 0} /> : <p className="text-base text-ink-muted">The Director calculates and publishes results.</p>}
        <div className="overflow-x-auto rounded-card border border-line bg-white shadow-card">
          <table className="w-full min-w-[640px] text-left text-base">
            <thead className="bg-canvas text-sm text-ink-muted">
              <tr><th className="px-4 py-3 font-semibold">Student</th><th className="px-3 py-3 font-semibold">Modules</th><th className="px-3 py-3 font-semibold">Capstone</th><th className="px-3 py-3 font-semibold">Attendance</th><th className="px-3 py-3 font-semibold">Total</th><th className="px-3 py-3 font-semibold">Result</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {k.students.map((s) => {
                const r = byE.get(s.id)
                const mods = k.modules.map((m) => scoreOf(s.id, 'module', m.id)).filter((x): x is number => x !== undefined)
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-3"><p className="font-semibold text-navy">{s.name}</p><p className="text-sm text-ink-muted">{s.reg_no}</p></td>
                    <td className="px-3 py-3">{mods.length ? `${Math.round(mods.reduce((a, b) => a + b, 0) / mods.length)}% (${mods.length}/${k.modules.length})` : '—'}</td>
                    <td className="px-3 py-3">{scoreOf(s.id, 'capstone') ?? '—'}</td>
                    <td className="px-3 py-3">
                      {r?.attendance_pct != null ? `${Math.round(r.attendance_pct)}%` : '—'}
                      {c.attendance_mode === 'required' && director && (
                        <form action={setWaiver} className="mt-1">
                          <input type="hidden" name="cohort_id" value={id} /><input type="hidden" name="enrolment_id" value={s.id} /><input type="hidden" name="waived" value={s.attendance_waived ? 'no' : 'yes'} />
                          <button type="submit" className="text-sm font-semibold text-teal hover:underline">{s.attendance_waived ? 'Waived · undo' : 'Waive'}</button>
                        </form>
                      )}
                    </td>
                    <td className="px-3 py-3 font-semibold">{r?.total_pct != null ? `${r.total_pct}%` : '—'}</td>
                    <td className="px-3 py-3">{r?.classification ? <Badge tone={r.classification === 'Fail' ? 'crimson' : r.classification === 'Distinction' ? 'navy' : 'success'}>{r.classification}</Badge> : '—'}{r?.published_at && <p className="mt-1 text-sm text-ink-muted">Published</p>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  } else {
    body = (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card><h2 className="mb-4 text-h3 font-semibold">New announcement</h2><AnnouncementForm cohortId={id} /></Card>
        <div className="space-y-3">
          {k.announcements.length === 0 && <p className="rounded-card border border-line bg-white p-5 text-base text-ink-muted">No announcements yet.</p>}
          {k.announcements.map((a) => (
            <article key={a.id} className="rounded-card border border-line bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="font-semibold text-navy">{a.title}</h3><p className="text-sm text-ink-muted">{formatDateTime(a.created_at)}</p></div>
                <form action={deleteAnnouncement}><input type="hidden" name="cohort_id" value={id} /><input type="hidden" name="id" value={a.id} /><Button type="submit" variant="ghost" className="text-crimson" aria-label="Remove announcement"><Trash2 className="h-4 w-4" aria-hidden /></Button></form>
              </div>
              <p className="mt-2 whitespace-pre-line text-base text-ink">{a.body}</p>
            </article>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/classes" className="mb-3 inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-navy hover:text-teal"><ArrowLeft className="h-5 w-5" aria-hidden /> Classes</Link>
      <PageHeader eyebrow={`${c.programmes?.code} · ${c.programmes?.short_title}`} title={c.name} intro={`${formatDate(c.start_date)} to ${formatDate(c.end_date)} · ${k.students.length} students`}
        action={c.class_group_url ? <a href={c.class_group_url} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-teal hover:underline">Class group <ExternalLink className="h-4 w-4" aria-hidden /></a> : undefined} />
      <Tabs current={tab} items={[
        { key: 'overview', label: 'Overview', href: base },
        { key: 'timetable', label: 'Timetable', href: `${base}?tab=timetable`, count: k.sessions.length || undefined },
        ...(c.attendance_mode !== 'off' ? [{ key: 'attendance', label: 'Attendance', href: `${base}?tab=attendance` }] : []),
        { key: 'scores', label: 'Scores', href: `${base}?tab=scores` },
        { key: 'results', label: 'Results', href: `${base}?tab=results` },
        { key: 'announcements', label: 'Announcements', href: `${base}?tab=announcements` },
      ]} />
      <div className="mt-6">{body}</div>
    </div>
  )
}
