'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { CalendarPlus, CheckCircle2, Hourglass, Send, XCircle } from 'lucide-react'
import { Alert, Button, Input, Textarea } from '@/components/ui'
import {
  declineApplication,
  extendOffer,
  makeOffer,
  requestChanges,
  startReview,
  withdrawOffer,
  type ActionState,
} from '@/lib/admin/actions'

export type DecisionInfo = {
  id: string
  status: string
  offerDays: number
  docs: { total: number; approved: number; pending: number; rejected: number }
  rejectedLabels: string[]
  payBy?: string
  daysLeft?: number
  lapsed?: boolean
  extendDefault?: string
  today: string
  decisionReason?: string | null
  regNo?: string | null
  seats?: { taken: number; capacity: number }
}

function Submit({ children, variant = 'primary', disabled }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'destructive'; disabled?: boolean }) {
  const { pending } = useFormStatus()
  return <Button type="submit" size="lg" variant={variant} loading={pending} disabled={disabled} className="w-full">{children}</Button>
}

function Result({ state }: { state: ActionState }) {
  if (state.error) return <Alert tone="error" title={state.error} />
  if (state.ok && state.message) return <Alert tone="success" title={state.message} />
  return null
}

function Hidden({ id }: { id: string }) {
  return <input type="hidden" name="application_id" value={id} />
}

/** A collapsed area for actions that should never be clicked by accident. */
function Careful({ summary, children }: { summary: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-line">
      <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-2 px-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {summary}
        <span className="text-ink-muted transition group-open:rotate-180" aria-hidden>▾</span>
      </summary>
      <div className="space-y-3 border-t border-line p-4">{children}</div>
    </details>
  )
}

function DeclineForm({ id }: { id: string }) {
  const [state, action] = useActionState<ActionState, FormData>(declineApplication, {})
  return (
    <Careful summary="Decline this application">
      <form action={action} className="space-y-3">
        <Hidden id={id} />
        <Result state={state} />
        <label htmlFor="decline-reason" className="block text-label font-semibold">Reason (the applicant will see this)</label>
        <Textarea id="decline-reason" name="reason" required minLength={10} placeholder="For example: Does not meet the entry requirements for this programme." className="min-h-[96px]" />
        <Submit variant="destructive"><XCircle className="h-5 w-5" aria-hidden /> Decline application</Submit>
      </form>
    </Careful>
  )
}

export function DecisionPanel({ info }: { info: DecisionInfo }) {
  const [startState, start] = useActionState<ActionState, FormData>(startReview, {})
  const [offerState, offer] = useActionState<ActionState, FormData>(makeOffer, {})
  const [changesState, changes] = useActionState<ActionState, FormData>(requestChanges, {})
  const [extendState, extend] = useActionState<ActionState, FormData>(extendOffer, {})
  const [withdrawState, withdraw] = useActionState<ActionState, FormData>(withdrawOffer, {})
  const { docs } = info
  const allApproved = docs.total > 0 && docs.approved === docs.total
  const full = info.seats ? info.seats.taken >= info.seats.capacity : false

  return (
    <section aria-labelledby="decision-h" className="rounded-card border border-line bg-white p-5 shadow-card">
      <h2 id="decision-h" className="text-h3 font-semibold text-navy">Decision</h2>

      {info.status === 'draft' && <p className="mt-3 text-base text-ink-muted">The applicant hasn’t submitted yet. You can review once they submit.</p>}

      {info.status === 'submitted' && (
        <form action={start} className="mt-4 space-y-3">
          <Hidden id={info.id} />
          <Result state={startState} />
          <p className="text-base text-ink">New application. Starting the review lets the applicant see that it’s being looked at. Approving or rejecting a document also starts it.</p>
          <Submit>Start review</Submit>
        </form>
      )}

      {(info.status === 'submitted' || info.status === 'under_review') && (
        <div className="mt-5 space-y-5">
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-success-50 p-3"><dt className="text-sm text-ink-muted">Approved</dt><dd className="font-display text-xl font-bold text-success">{docs.approved}</dd></div>
            <div className="rounded-xl bg-amber-50 p-3"><dt className="text-sm text-ink-muted">To check</dt><dd className="font-display text-xl font-bold text-amber">{docs.pending}</dd></div>
            <div className="rounded-xl bg-crimson-50 p-3"><dt className="text-sm text-ink-muted">Rejected</dt><dd className="font-display text-xl font-bold text-crimson">{docs.rejected}</dd></div>
          </dl>

          <form action={offer} className="space-y-3">
            <Hidden id={info.id} />
            <Result state={offerState} />
            <div className="flex items-end gap-3">
              <label className="flex-1" htmlFor="offer-days">
                <span className="mb-1.5 block text-label font-semibold">Days to pay tuition</span>
                <Input id="offer-days" name="days" type="number" min={1} max={60} defaultValue={info.offerDays} inputMode="numeric" />
              </label>
            </div>
            {info.seats && <p className="text-sm text-ink-muted">{info.seats.taken} of {info.seats.capacity} seats taken in this intake.</p>}
            {!allApproved && <p className="text-sm text-ink-muted">Approve every document to make an offer.</p>}
            {full && <p className="text-sm font-semibold text-crimson">This intake is full. A Director can add seats under Intakes.</p>}
            <Submit disabled={!allApproved || full}><CheckCircle2 className="h-5 w-5" aria-hidden /> Make offer</Submit>
          </form>

          {docs.rejected > 0 && (
            <form action={changes} className="space-y-3 rounded-xl border border-amber/40 bg-amber-50/60 p-4">
              <Hidden id={info.id} />
              <Result state={changesState} />
              <p className="text-base text-ink">The applicant will be asked to replace: <strong>{info.rejectedLabels.join(', ')}</strong>.</p>
              <label htmlFor="changes-note" className="block text-label font-semibold">Note to the applicant (optional)</label>
              <Textarea id="changes-note" name="note" className="min-h-[80px]" placeholder="Anything else they should know" />
              <Submit variant="secondary"><Send className="h-5 w-5" aria-hidden /> Ask applicant to fix documents</Submit>
            </form>
          )}

          <DeclineForm id={info.id} />
        </div>
      )}

      {info.status === 'changes_requested' && (
        <div className="mt-4 space-y-4">
          <Alert tone="warning" title="Waiting for the applicant">
            They’ve been asked to replace: {info.rejectedLabels.join(', ') || 'rejected documents'}. The application comes back to “To review” as soon as they do.
          </Alert>
          <DeclineForm id={info.id} />
        </div>
      )}

      {info.status === 'offered' && (
        <div className="mt-4 space-y-4">
          {info.lapsed ? (
            <Alert tone="error" title={`Offer lapsed on ${info.payBy}`}>Tuition wasn’t paid in time, so the seat is free again. Extend the offer to let them pay, or withdraw it.</Alert>
          ) : (
            <Alert tone="info" title={`Waiting for tuition. Pay by ${info.payBy}`}>
              {info.daysLeft === 0 ? 'Today is the last day.' : `${info.daysLeft} day${info.daysLeft === 1 ? '' : 's'} left.`} The applicant is admitted automatically when they pay.
            </Alert>
          )}
          <form action={extend} className="space-y-3">
            <Hidden id={info.id} />
            <Result state={extendState} />
            <label htmlFor="extend-until" className="block text-label font-semibold">New last day to pay</label>
            <Input id="extend-until" name="until" type="date" min={info.today} defaultValue={info.extendDefault} required />
            <Submit variant="secondary"><CalendarPlus className="h-5 w-5" aria-hidden /> Extend offer</Submit>
          </form>
          <Careful summary="Withdraw this offer">
            <form action={withdraw} className="space-y-3">
              <Hidden id={info.id} />
              <Result state={withdrawState} />
              <label htmlFor="withdraw-reason" className="block text-label font-semibold">Reason</label>
              <Textarea id="withdraw-reason" name="reason" required className="min-h-[80px]" placeholder="For example: Tuition not paid by the deadline." />
              <Submit variant="destructive">Withdraw offer</Submit>
            </form>
          </Careful>
        </div>
      )}

      {info.status === 'admitted' && (
        <div className="mt-4">
          <Alert tone="success" title="Admitted">Tuition paid.{info.regNo ? ` Registration number ${info.regNo}.` : ''}</Alert>
          <a href={`/admin/applications/${info.id}/letter`} download className="mt-3 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-navy/25 bg-white px-5 font-semibold text-navy hover:bg-navy hover:text-white">Download admission letter</a>
        </div>
      )}

      {(info.status === 'declined' || info.status === 'withdrawn' || info.status === 'offer_expired') && (
        <div className="mt-4">
          <Alert tone="warning" title={info.status === 'declined' ? 'Declined' : 'Closed'}>
            {info.decisionReason ? `Reason: ${info.decisionReason}` : 'This application is closed.'}
          </Alert>
        </div>
      )}

      {info.status === 'under_review' && docs.pending > 0 && (
        <p className="mt-4 flex items-start gap-2 text-sm text-ink-muted"><Hourglass className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Check each document first.</p>
      )}
    </section>
  )
}
