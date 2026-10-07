'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Alert, Button, Field, Input, Select } from '@/components/ui'
import { saveCohort } from '@/lib/admin/manage-actions'
import type { ActionState } from '@/lib/admin/actions'
import type { CohortRow } from '@/lib/admin/queries'

function Save({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto">{label}</Button>
}

export const COHORT_STATUS: Record<CohortRow['status'], string> = {
  draft: 'Draft (hidden)',
  open: 'Open for applications',
  closed: 'Closed to applications',
  running: 'Classes running',
  completed: 'Completed',
}

export function IntakeForm({ cohort, programmes }: { cohort?: CohortRow; programmes: { id: string; code: string; short_title: string }[] }) {
  const [state, action] = useActionState<ActionState, FormData>(saveCohort, {})
  const k = cohort?.id ?? 'new'
  return (
    <form action={action} className="space-y-4">
      {cohort && <input type="hidden" name="id" value={cohort.id} />}
      {state.error && <Alert tone="error" title={state.error} />}
      {state.ok && state.message && <Alert tone="success" title={state.message} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`p-${k}`} label="Programme" required>
          <Select id={`p-${k}`} name="programme_id" defaultValue={cohort?.programme_id ?? ''} required disabled={!!cohort}>
            <option value="" disabled>Choose a programme</option>
            {programmes.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.short_title}</option>)}
          </Select>
          {cohort && <input type="hidden" name="programme_id" value={cohort.programme_id} />}
        </Field>
        <Field id={`n-${k}`} label="Intake name" required hint="Shown to applicants">
          <Input id={`n-${k}`} name="name" defaultValue={cohort?.name} placeholder="February 2027 cohort" required />
        </Field>
        <Field id={`s-${k}`} label="Classes start" required>
          <Input id={`s-${k}`} name="start_date" type="date" defaultValue={cohort?.start_date} required />
        </Field>
        <Field id={`e-${k}`} label="Classes end" required>
          <Input id={`e-${k}`} name="end_date" type="date" defaultValue={cohort?.end_date} required />
        </Field>
        <Field id={`d-${k}`} label="Applications close" required>
          <Input id={`d-${k}`} name="application_deadline" type="date" defaultValue={cohort?.application_deadline} required />
        </Field>
        <Field id={`c-${k}`} label="Seats" required>
          <Input id={`c-${k}`} name="capacity" type="number" min={1} max={500} inputMode="numeric" defaultValue={cohort?.capacity ?? 40} required />
        </Field>
        <Field id={`o-${k}`} label="Days to pay tuition after an offer" required hint="Usually 30">
          <Input id={`o-${k}`} name="offer_expiry_days" type="number" min={1} max={60} inputMode="numeric" defaultValue={cohort?.offer_expiry_days ?? 30} required />
        </Field>
        <Field id={`st-${k}`} label="Status" required>
          <Select id={`st-${k}`} name="status" defaultValue={cohort?.status ?? 'draft'}>
            {Object.entries(COHORT_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field id={`v-${k}`} label="Venue">
            <Input id={`v-${k}`} name="venue" defaultValue={cohort?.venue ?? ''} placeholder="IPCM Lecture Hall, Taraba State University, Jalingo" />
          </Field>
        </div>
      </div>
      <Save label={cohort ? 'Save changes' : 'Create intake'} />
    </form>
  )
}
