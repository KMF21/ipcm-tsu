import { redirect } from 'next/navigation'
import { Card } from '@/components/ui'
import { DocumentsStep } from '@/components/apply/DocumentsStep'
import { createClient } from '@/lib/supabase/server'
import { getMyApplication, getMyDocuments } from '@/lib/application/queries'
import { requiredDocs, type StepData } from '@/lib/application/steps'

export const metadata = { title: 'Fix documents' }

/** Used when admissions has asked for a document to be replaced. */
export default async function FixDocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/portal/apply/documents')
  const app = await getMyApplication(supabase, user.id)
  if (!app) redirect('/portal/apply')
  if (app.status === 'draft') redirect('/portal/apply?step=6')
  if (app.status !== 'changes_requested') redirect('/portal/apply')
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-label font-semibold uppercase tracking-wide text-teal">Application {app.ref}</p>
      <h1 className="mt-2 text-[1.75rem] font-bold leading-9 sm:text-h1">Replace your documents</h1>
      <p className="mt-2 text-base text-ink-muted">Remove any file marked “Needs replacing”, then upload a new one.</p>
      <Card className="mt-6">
        <DocumentsStep mode="fix" required={requiredDocs(app.step_data as StepData)} optional={[]} documents={await getMyDocuments(supabase, app.id)} />
      </Card>
    </div>
  )
}
