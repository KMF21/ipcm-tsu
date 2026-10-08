'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Award, Ban, PackageCheck } from 'lucide-react'
import { Alert, Button, Field, Input } from '@/components/ui'
import type { ActionState } from '@/lib/admin/actions'
import { issueCertificates, recordCollection, revokeCertificate } from '@/lib/admin/certificate-actions'

function Submit({ children, variant = 'primary', size = 'md', className }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'destructive' | 'ghost'; size?: 'md' | 'lg'; className?: string }) {
  const { pending } = useFormStatus()
  return <Button type="submit" variant={variant} size={size} loading={pending} className={className}>{children}</Button>
}
function Result({ s }: { s: ActionState }) {
  if (s.error) return <Alert tone="error" title={s.error} />
  if (s.ok && s.message) return <Alert tone="success" title={s.message} />
  return null
}

/** Issue to everyone eligible, or (with enrolmentId) to one student. */
export function IssueForm({ cohortId, enrolmentId, count, name }: { cohortId: string; enrolmentId?: string; count?: number; name?: string }) {
  const [s, action] = useActionState<ActionState, FormData>(issueCertificates, {})
  const msg = enrolmentId ? `Issue a certificate to ${name}? Details are frozen once issued.` : `Issue ${count} certificate${count === 1 ? '' : 's'}? Names, programme and result are frozen once issued, so check the results first.`
  return (
    <form action={action} className="space-y-3" onSubmit={(e) => { if (!confirm(msg)) e.preventDefault() }}>
      <input type="hidden" name="cohort_id" value={cohortId} />
      {enrolmentId && <input type="hidden" name="enrolment_id" value={enrolmentId} />}
      <Result s={s} />
      {enrolmentId
        ? <Submit variant="secondary">Issue certificate</Submit>
        : <Submit size="lg" className="w-full sm:w-auto"><Award className="h-5 w-5" aria-hidden /> Issue {count} certificate{count === 1 ? '' : 's'}</Submit>}
    </form>
  )
}

export function CollectionForm({ cohortId, certificateId, defaultName }: { cohortId: string; certificateId: string; defaultName: string }) {
  const [s, action] = useActionState<ActionState, FormData>(recordCollection, {})
  return (
    <details className="group rounded-xl border border-line">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 px-4 font-semibold text-navy"><PackageCheck className="h-5 w-5 text-teal" aria-hidden /> Record collection</summary>
      <form action={action} className="space-y-3 border-t border-line p-4">
        <input type="hidden" name="cohort_id" value={cohortId} /><input type="hidden" name="certificate_id" value={certificateId} />
        <Result s={s} />
        <Field id={`cb-${certificateId}`} label="Collected by" required hint="The student, or the person collecting for them"><Input id={`cb-${certificateId}`} name="collected_by" defaultValue={defaultName} required /></Field>
        <Field id={`cn-${certificateId}`} label="ID shown or note (optional)"><Input id={`cn-${certificateId}`} name="note" placeholder="Voter’s card; collected by brother with signed note" /></Field>
        <Submit variant="secondary">Save collection</Submit>
      </form>
    </details>
  )
}

export function UndoCollectionForm({ cohortId, certificateId }: { cohortId: string; certificateId: string }) {
  const [s, action] = useActionState<ActionState, FormData>(recordCollection, {})
  return (
    <form action={action} onSubmit={(e) => { if (!confirm('Remove the collection record?')) e.preventDefault() }}>
      <input type="hidden" name="cohort_id" value={cohortId} /><input type="hidden" name="certificate_id" value={certificateId} /><input type="hidden" name="undo" value="yes" />
      {s.error && <p className="text-sm font-semibold text-crimson">{s.error}</p>}
      <button type="submit" className="min-h-[44px] text-sm font-semibold text-teal hover:underline">Undo collection</button>
    </form>
  )
}

export function RevokeForm({ cohortId, certificateId, certificateNo }: { cohortId: string; certificateId: string; certificateNo: string }) {
  const [s, action] = useActionState<ActionState, FormData>(revokeCertificate, {})
  return (
    <details className="group rounded-xl border border-line">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 px-4 font-semibold text-crimson"><Ban className="h-5 w-5" aria-hidden /> Revoke or replace</summary>
      <form action={action} className="space-y-3 border-t border-line p-4" onSubmit={(e) => { if (!confirm(`Revoke ${certificateNo}? The online check will show it as revoked. This can’t be undone.`)) e.preventDefault() }}>
        <input type="hidden" name="cohort_id" value={cohortId} /><input type="hidden" name="certificate_id" value={certificateId} />
        <Result s={s} />
        <Field id={`rr-${certificateId}`} label="Reason" required hint="Kept in the record, not shown to the public"><Input id={`rr-${certificateId}`} name="reason" placeholder="Paper damaged; name misspelt; result corrected" required minLength={5} /></Field>
        <label className="flex min-h-[44px] items-center gap-3 text-base text-ink">
          <input type="checkbox" name="reissue" defaultChecked className="h-5 w-5 rounded border-line text-teal focus:ring-teal" /> Issue a replacement with a new number
        </label>
        <Submit variant="destructive">Revoke certificate</Submit>
      </form>
    </details>
  )
}
