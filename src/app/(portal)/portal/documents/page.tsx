import { redirect } from 'next/navigation'
import { Download, ExternalLink, FileText, Receipt } from 'lucide-react'
import { Alert, Badge, ButtonLink, Card, EmptyState, buttonClass } from '@/components/ui'
import { PortalHeader } from '@/components/portal/PortalHeader'
import { createClient } from '@/lib/supabase/server'
import { getMyApplication, getMyDocuments } from '@/lib/application/queries'
import { getMyEnrolment } from '@/lib/portal/queries'
import { DOC_RULES, formatBytes, type DocType } from '@/lib/application/steps'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Documents' }

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/portal/documents')
  const [app, enrolment] = await Promise.all([getMyApplication(supabase, user.id), getMyEnrolment(supabase, user.id)])
  const docs = app ? await getMyDocuments(supabase, app.id) : []
  const links: Record<string, string> = {}
  if (docs.length) {
    const { data } = await supabase.storage.from('applicant-documents').createSignedUrls(docs.map((d) => d.storage_path), 600)
    for (const s of data ?? []) if (s.path && s.signedUrl) links[s.path] = s.signedUrl
  }
  const rejected = docs.filter((d) => d.status === 'rejected')

  return (
    <div className="mx-auto max-w-4xl">
      <PortalHeader title="Documents" intro="Everything we issued to you, and the files you uploaded with your application." />

      <Card>
        <h2 className="text-h3 font-semibold">From the Institute</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          {enrolment ? (
            <a href={`/portal/admission-letter/${enrolment.application_id}`} download className={buttonClass('primary', 'lg', 'w-full sm:w-auto')}><Download className="h-5 w-5" aria-hidden /> Admission letter</a>
          ) : (
            <p className="text-base text-ink-muted sm:flex-1">Your admission letter appears here once you are admitted.</p>
          )}
          <ButtonLink href="/portal/payments" variant="secondary" size="lg" className="w-full sm:w-auto"><Receipt className="h-5 w-5" aria-hidden /> Payment receipts</ButtonLink>
        </div>
      </Card>

      <section className="mt-8">
        <h2 className="text-h3 font-semibold">Your uploads</h2>
        {app?.status === 'changes_requested' && rejected.length > 0 && (
          <div className="mt-4"><Alert tone="warning" title="Some documents need replacing">Open the fix page to remove each rejected file and upload a new one.<div className="mt-3"><ButtonLink href="/portal/apply/documents">Fix my documents</ButtonLink></div></Alert></div>
        )}
        {docs.length === 0 ? (
          <div className="mt-4"><EmptyState title="No documents yet" body="Documents you upload with your application are listed here." action={<ButtonLink href="/portal/apply">Go to my application</ButtonLink>} /></div>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-card border border-line bg-white shadow-card">
            {docs.map((d) => (
              <li key={d.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <FileText className="hidden h-6 w-6 shrink-0 text-teal sm:block" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy">{DOC_RULES[d.type as DocType]?.label ?? d.type}</p>
                  <p className="text-sm text-ink-muted">{d.mime === 'application/pdf' ? 'PDF' : 'Image'} · {formatBytes(d.size_bytes)} · uploaded {formatDate(d.created_at)}</p>
                  {d.status === 'rejected' && d.rejection_reason && <p className="mt-1 text-sm text-crimson">{d.rejection_reason}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={d.status === 'approved' ? 'success' : d.status === 'rejected' ? 'crimson' : 'amber'}>{d.status === 'approved' ? 'Approved' : d.status === 'rejected' ? 'Rejected' : 'Being checked'}</Badge>
                  {links[d.storage_path] && <a href={links[d.storage_path]} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-teal hover:underline">Open <ExternalLink className="h-4 w-4" aria-hidden /></a>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
