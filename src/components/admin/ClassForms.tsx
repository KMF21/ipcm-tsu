'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Check, Megaphone, Save } from 'lucide-react'
import { Alert, Button, Field, Input, Select, Textarea } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { ActionState } from '@/lib/admin/actions'
import {
  computeResults,
  postAnnouncement,
  publishResults,
  saveAttendance,
  saveClassSettings,
  saveSession,
  saveStudentScores,
} from '@/lib/admin/class-actions'
import type { ClassModule, ClassStudent } from '@/lib/admin/classes'

function Submit({ children, variant = 'primary', size = 'md', className }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'destructive' | 'ghost'; size?: 'md' | 'lg'; className?: string }) {
  const { pending } = useFormStatus()
  return <Button type="submit" variant={variant} size={size} loading={pending} className={className}>{children}</Button>
}
function Result({ s }: { s: ActionState }) {
  if (s.error) return <Alert tone="error" title={s.error} />
  if (s.ok && s.message) return <Alert tone="success" title={s.message} />
  return null
}

/* ---------- Settings ---------- */
export function ClassSettingsForm({ cohortId, mode, min, group, materials }: { cohortId: string; mode: string; min: number | null; group: string | null; materials: string | null }) {
  const [s, action] = useActionState<ActionState, FormData>(saveClassSettings, {})
  const [m, setM] = useState(mode)
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="cohort_id" value={cohortId} />
      <Result s={s} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="cs-mode" label="Attendance">
          <Select id="cs-mode" name="attendance_mode" value={m} onChange={(e) => setM(e.target.value)}>
            <option value="off">Off (not tracked)</option>
            <option value="info">For information only</option>
            <option value="required">Required for the certificate</option>
          </Select>
        </Field>
        {m === 'required' && (
          <Field id="cs-min" label="Minimum attendance %" hint="You can still waive it for a student">
            <Input id="cs-min" name="min_attendance_pct" type="number" min={0} max={100} inputMode="numeric" defaultValue={min ?? 75} />
          </Field>
        )}
        <Field id="cs-group" label="Class WhatsApp group link" hint="Students see this on their dashboard">
          <Input id="cs-group" name="class_group_url" type="url" placeholder="https://chat.whatsapp.com/…" defaultValue={group ?? ''} />
        </Field>
        <Field id="cs-mat" label="Materials folder link (optional)" hint="Google Drive or similar">
          <Input id="cs-mat" name="materials_url" type="url" placeholder="https://drive.google.com/…" defaultValue={materials ?? ''} />
        </Field>
      </div>
      <Submit><Save className="h-5 w-5" aria-hidden /> Save settings</Submit>
    </form>
  )
}

/* ---------- Timetable ---------- */
export function SessionForm({ cohortId, modules, defaults }: { cohortId: string; modules: ClassModule[]; defaults?: { id: string; title: string; module_id: string | null; date: string; start: string; end: string; venue: string | null } }) {
  const [s, action] = useActionState<ActionState, FormData>(saveSession, {})
  const k = defaults?.id ?? 'new'
  return (
    <form action={action} className="space-y-4" key={s.ok && !defaults ? Math.random() : k}>
      <input type="hidden" name="cohort_id" value={cohortId} />
      {defaults && <input type="hidden" name="id" value={defaults.id} />}
      <Result s={s} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`ss-t-${k}`} label="Title" required><Input id={`ss-t-${k}`} name="title" defaultValue={defaults?.title} placeholder="Week 1: Foundations" required /></Field>
        <Field id={`ss-m-${k}`} label="Module (optional)">
          <Select id={`ss-m-${k}`} name="module_id" defaultValue={defaults?.module_id ?? ''}>
            <option value="">None</option>
            {modules.map((m) => <option key={m.id} value={m.id}>Module {m.number}: {m.title}</option>)}
          </Select>
        </Field>
        <Field id={`ss-d-${k}`} label="Date" required><Input id={`ss-d-${k}`} name="date" type="date" defaultValue={defaults?.date} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id={`ss-s-${k}`} label="Starts" required><Input id={`ss-s-${k}`} name="start" type="time" defaultValue={defaults?.start ?? '09:00'} required /></Field>
          <Field id={`ss-e-${k}`} label="Ends" required><Input id={`ss-e-${k}`} name="end" type="time" defaultValue={defaults?.end ?? '16:00'} required /></Field>
        </div>
        <div className="sm:col-span-2"><Field id={`ss-v-${k}`} label="Venue (optional)" hint="Leave empty to use the intake’s venue"><Input id={`ss-v-${k}`} name="venue" defaultValue={defaults?.venue ?? ''} /></Field></div>
      </div>
      <Submit>{defaults ? 'Save session' : 'Add session'}</Submit>
    </form>
  )
}

/* ---------- Attendance ---------- */
type Mark = 'present' | 'absent' | 'excused'
export function AttendanceForm({ cohortId, sessionId, students, marks }: { cohortId: string; sessionId: string; students: ClassStudent[]; marks: Record<string, Mark> }) {
  const [s, action] = useActionState<ActionState, FormData>(saveAttendance, {})
  const [state, setState] = useState<Record<string, Mark | undefined>>(marks)
  const opts: { v: Mark; label: string; on: string }[] = [
    { v: 'present', label: 'Present', on: 'bg-success text-white border-success' },
    { v: 'absent', label: 'Absent', on: 'bg-crimson text-white border-crimson' },
    { v: 'excused', label: 'Excused', on: 'bg-amber text-white border-amber' },
  ]
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="cohort_id" value={cohortId} />
      <input type="hidden" name="session_id" value={sessionId} />
      <Result s={s} />
      <Button type="button" variant="secondary" onClick={() => setState(Object.fromEntries(students.map((st) => [st.id, 'present'])))}>
        <Check className="h-5 w-5" aria-hidden /> Mark everyone present
      </Button>
      <ul className="divide-y divide-line rounded-card border border-line bg-white">
        {students.map((st) => (
          <li key={st.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><p className="font-semibold text-navy">{st.name}</p><p className="text-sm text-ink-muted">{st.reg_no}</p></div>
            <fieldset className="grid grid-cols-3 gap-2 sm:flex" aria-label={`Attendance for ${st.name}`}>
              {opts.map((o) => (
                <label key={o.v} className={cn('flex min-h-[44px] cursor-pointer items-center justify-center rounded-full border px-4 text-sm font-semibold', state[st.id] === o.v ? o.on : 'border-line text-ink hover:border-teal')}>
                  <input type="radio" className="sr-only" name={`mark:${st.id}`} value={o.v} checked={state[st.id] === o.v} onChange={() => setState((p) => ({ ...p, [st.id]: o.v }))} />
                  {o.label}
                </label>
              ))}
            </fieldset>
          </li>
        ))}
      </ul>
      <Submit size="lg" className="w-full sm:w-auto"><Save className="h-5 w-5" aria-hidden /> Save attendance</Submit>
    </form>
  )
}

/* ---------- Scores ---------- */
export function ScoreRow({ cohortId, student, modules, values, locked }: { cohortId: string; student: ClassStudent; modules: ClassModule[]; values: Record<string, number | undefined>; locked: boolean }) {
  const [s, action] = useActionState<ActionState, FormData>(saveStudentScores, {})
  return (
    <li className="px-4 py-4">
      <form action={action} className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <input type="hidden" name="cohort_id" value={cohortId} />
        <input type="hidden" name="enrolment_id" value={student.id} />
        <div className="min-w-0 lg:w-56"><p className="font-semibold text-navy">{student.name}</p><p className="text-sm text-ink-muted">{student.reg_no}</p></div>
        <div className="grid flex-1 grid-cols-3 gap-2 sm:grid-cols-5">
          {modules.map((m) => (
            <label key={m.id} className="text-sm text-ink-muted">
              M{m.number}
              <Input name={`module:${m.id}`} type="number" min={0} max={100} step="0.5" inputMode="decimal" defaultValue={values[m.id] ?? ''} disabled={locked} className="mt-1 px-3 text-center" aria-label={`Module ${m.number} score for ${student.name}`} />
            </label>
          ))}
          <label className="text-sm font-semibold text-navy">
            Capstone
            <Input name="capstone" type="number" min={0} max={100} step="0.5" inputMode="decimal" defaultValue={values.capstone ?? ''} disabled={locked} className="mt-1 px-3 text-center" aria-label={`Capstone score for ${student.name}`} />
          </label>
        </div>
        {!locked && <Submit variant="secondary">Save</Submit>}
      </form>
      {s.error && <p className="mt-2 text-sm font-semibold text-crimson">{s.error}</p>}
      {s.ok && <p className="mt-2 text-sm font-semibold text-success">Saved</p>}
    </li>
  )
}

/* ---------- Results ---------- */
export function ResultsActions({ cohortId, published, hasResults }: { cohortId: string; published: boolean; hasResults: boolean }) {
  const [cs, compute] = useActionState<ActionState, FormData>(computeResults, {})
  const [ps, publish] = useActionState<ActionState, FormData>(publishResults, {})
  return (
    <div className="space-y-3">
      <Result s={ps.ok || ps.error ? ps : cs} />
      <div className="flex flex-col gap-3 sm:flex-row">
        {!published && (
          <form action={compute}><input type="hidden" name="cohort_id" value={cohortId} /><Submit variant="secondary" size="lg">Calculate results</Submit></form>
        )}
        {!published && hasResults && (
          <form action={publish} onSubmit={(e) => { if (!confirm('Publish results? Students will see them and be emailed.')) e.preventDefault() }}>
            <input type="hidden" name="cohort_id" value={cohortId} /><input type="hidden" name="publish" value="yes" />
            <Submit size="lg">Publish results</Submit>
          </form>
        )}
        {published && (
          <form action={publish} onSubmit={(e) => { if (!confirm('Hide results from students so scores can be corrected?')) e.preventDefault() }}>
            <input type="hidden" name="cohort_id" value={cohortId} /><input type="hidden" name="publish" value="no" />
            <Submit variant="ghost" size="lg">Unpublish to make corrections</Submit>
          </form>
        )}
      </div>
    </div>
  )
}

/* ---------- Announcements ---------- */
export function AnnouncementForm({ cohortId }: { cohortId: string }) {
  const [s, action] = useActionState<ActionState, FormData>(postAnnouncement, {})
  return (
    <form action={action} className="space-y-4" key={s.ok ? Math.random() : 'form'}>
      <input type="hidden" name="cohort_id" value={cohortId} />
      <Result s={s} />
      <Field id="an-t" label="Title" required><Input id="an-t" name="title" placeholder="No class this Saturday" required /></Field>
      <Field id="an-b" label="Message" required><Textarea id="an-b" name="body" rows={4} className="min-h-[110px]" required /></Field>
      <label className="flex min-h-[44px] items-center gap-3 text-base text-ink">
        <input type="checkbox" name="email" defaultChecked className="h-5 w-5 rounded border-line text-teal focus:ring-teal" /> Also email every student in this class
      </label>
      <Submit><Megaphone className="h-5 w-5" aria-hidden /> Post announcement</Submit>
    </form>
  )
}
