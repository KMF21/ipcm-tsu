'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { CheckCircle2, ExternalLink, FileText, XCircle } from 'lucide-react'
import { Alert, Badge, Button, Textarea } from '@/components/ui'
import { reviewDocument, type ActionState } from '@/lib/admin/actions'

export type ReviewDoc = {
  id: string
  label: string
  mime: string
  size: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  url?: string
}

const QUICK_REASONS: Record<string, string[]> = {
  image: ['Photo is blurred or too dark. Upload a clear, recent photo.', 'Background is not plain. Use a plain white background.'],
  pdf: ['File is unreadable or incomplete. Upload a clear scan of the whole document.', 'Wrong document. Upload the document asked for here.'],
}

function Submit({ children, variant = 'primary', disabled }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'destructive'; disabled?: boolean }) {
  const { pending } = useFormStatus()
  return <Button type="submit" variant={variant} loading={pending} disabled={disabled} className="w-full sm:w-auto">{children}</Button>
}

export function DocumentReview({ doc, applicationId, editable }: { doc: ReviewDoc; applicationId: string; editable: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(reviewDocument, {})
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  useEffect(() => {
    if (state.ok) setRejecting(false)
  }, [state])
  const isImage = doc.mime.startsWith('image/')
  const tone = doc.status === 'approved' ? 'success' : doc.status === 'rejected' ? 'crimson' : 'amber'

  return (
    <article className="rounded-card border border-line bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        <a
          href={doc.url}
          target="_blank"
          rel="noreferrer"
          className="flex h-40 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-canvas sm:h-32 sm:w-28"
          aria-label={`Open ${doc.label} in a new tab`}
        >
          {isImage && doc.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doc.url} alt={doc.label} className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-ink-muted"><FileText className="h-9 w-9 text-teal" aria-hidden /><span className="text-sm font-semibold">PDF</span></span>
          )}
        </a>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-navy">{doc.label}</h3>
              <p className="text-sm text-ink-muted">{isImage ? 'Image' : 'PDF'} · {doc.size}</p>
            </div>
            <Badge tone={tone}>{doc.status === 'pending' ? 'Not checked' : doc.status === 'approved' ? 'Approved' : 'Rejected'}</Badge>
          </div>
          {doc.status === 'rejected' && doc.rejection_reason && <p className="mt-2 rounded-xl bg-crimson-50 p-3 text-sm text-ink"><strong>Reason given:</strong> {doc.rejection_reason}</p>}
          {doc.url && (
            <a href={doc.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-teal hover:underline">
              Open full size <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          )}

          {editable && (
            <div className="mt-3 space-y-3">
              {state.error && <Alert tone="error" title={state.error} />}
              {!rejecting ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  {doc.status !== 'approved' && (
                    <form action={action}>
                      <input type="hidden" name="application_id" value={applicationId} />
                      <input type="hidden" name="document_id" value={doc.id} />
                      <input type="hidden" name="decision" value="approve" />
                      <Submit><CheckCircle2 className="h-5 w-5" aria-hidden /> Approve</Submit>
                    </form>
                  )}
                  {doc.status !== 'rejected' && (
                    <Button type="button" variant="secondary" onClick={() => setRejecting(true)} className="w-full sm:w-auto">
                      <XCircle className="h-5 w-5" aria-hidden /> Reject
                    </Button>
                  )}
                </div>
              ) : (
                <form action={action} className="space-y-3 rounded-xl border border-crimson/30 bg-crimson-50/50 p-3">
                  <input type="hidden" name="application_id" value={applicationId} />
                  <input type="hidden" name="document_id" value={doc.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <label htmlFor={`reason-${doc.id}`} className="block text-label font-semibold text-ink">What should the applicant fix? They will see this.</label>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_REASONS[isImage ? 'image' : 'pdf'].map((r) => (
                      <button key={r} type="button" onClick={() => setReason(r)} className="rounded-full border border-line bg-white px-3 py-1.5 text-left text-sm text-ink hover:border-teal">{r}</button>
                    ))}
                  </div>
                  <Textarea id={`reason-${doc.id}`} name="reason" required value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[96px]" />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Submit variant="destructive" disabled={!reason.trim()}>Reject document</Submit>
                    <Button type="button" variant="ghost" onClick={() => setRejecting(false)}>Cancel</Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
