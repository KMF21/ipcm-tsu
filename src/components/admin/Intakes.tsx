import { CalendarRange, Plus, Users } from 'lucide-react'
import { Badge } from '@/components/ui'
import { IntakeForm, COHORT_STATUS } from './IntakeForm'
import type { CohortRow } from '@/lib/admin/queries'
import { formatDate } from '@/lib/utils'

const tone = { draft: 'neutral', open: 'success', closed: 'amber', running: 'teal', completed: 'navy' } as const

export function Intakes({ cohorts, programmes, canEdit }: { cohorts: CohortRow[]; programmes: { id: string; code: string; short_title: string }[]; canEdit: boolean }) {
  return (
    <div className="space-y-4">
      {canEdit && (
        <details className="group rounded-card border border-dashed border-teal/50 bg-white">
          <summary className="flex min-h-[56px] cursor-pointer list-none items-center gap-2 px-5 font-semibold text-teal [&::-webkit-details-marker]:hidden">
            <Plus className="h-5 w-5" aria-hidden /> New intake
          </summary>
          <div className="border-t border-line p-5"><IntakeForm programmes={programmes} /></div>
        </details>
      )}
      {cohorts.length === 0 && <p className="rounded-card border border-line bg-white p-5 text-base text-ink-muted">No intakes yet.</p>}
      {cohorts.map((c) => {
        const s = c.seats ?? { admitted: 0, offers_open: 0, under_review: 0, seats_taken: 0 }
        const pct = Math.min(100, Math.round((s.seats_taken / Math.max(1, c.capacity)) * 100))
        return (
          <article key={c.id} className="rounded-card border border-line bg-white p-5 shadow-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-teal">{c.programmes?.code} · {c.programmes?.short_title}</p>
                <h2 className="text-h3 font-semibold text-navy">{c.name}</h2>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-base text-ink-muted">
                  <CalendarRange className="h-4 w-4" aria-hidden /> {formatDate(c.start_date)} to {formatDate(c.end_date)} · applications close {formatDate(c.application_deadline)}
                </p>
              </div>
              <Badge tone={tone[c.status]}>{COHORT_STATUS[c.status]}</Badge>
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex flex-wrap justify-between gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 font-semibold text-ink"><Users className="h-4 w-4" aria-hidden /> {s.seats_taken} of {c.capacity} seats taken</span>
                <span className="text-ink-muted">{s.admitted} admitted · {s.offers_open} offers open · {s.under_review} in review</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Seats taken">
                <div className={`h-full rounded-full ${pct >= 100 ? 'bg-crimson' : pct >= 80 ? 'bg-amber' : 'bg-teal'}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-sm text-ink-muted">
                Offers last {c.offer_expiry_days} days · attendance {c.attendance_mode === 'off' ? 'not tracked' : c.attendance_mode === 'info' ? 'for information only' : `required (${c.min_attendance_pct ?? 0}%)`}
                {c.accept_late ? ' · late applications open' : ''}{c.venue ? ` · ${c.venue}` : ''}
              </p>
            </div>
            {canEdit && (
              <details className="mt-4 rounded-xl border border-line">
                <summary className="flex min-h-[48px] cursor-pointer list-none items-center px-4 font-semibold text-teal [&::-webkit-details-marker]:hidden">Edit intake</summary>
                <div className="border-t border-line p-4"><IntakeForm cohort={c} programmes={programmes} /></div>
              </details>
            )}
          </article>
        )
      })}
    </div>
  )
}
