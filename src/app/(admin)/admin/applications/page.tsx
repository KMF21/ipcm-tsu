import { ApplicationsList } from '@/components/admin/ApplicationsList'
import { Download } from 'lucide-react'
import { buttonClass } from '@/components/ui'
import { PageHeader } from '@/components/admin/bits'
import { PAGE_SIZE, getFilterOptions, listApplications } from '@/lib/admin/queries'
import { can } from '@/lib/admin/roles'
import { requireStaff } from '@/lib/admin/session'
import { LIST_TABS, type ListTab } from '@/lib/admin/status'

export const metadata = { title: 'Applications' }

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const { supabase } = await requireStaff(can.review)
  const tab = (LIST_TABS.some((t) => t.key === sp.tab) ? sp.tab : 'review') as ListTab
  const params = { tab, q: sp.q || undefined, programme: sp.programme || undefined, cohort: sp.cohort || undefined }
  const [list, options] = await Promise.all([
    listApplications(supabase, { ...params, page: Number(sp.page) || 1 }),
    getFilterOptions(supabase),
  ])
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Admissions" title="Applications" intro="Open an application to check the documents and make a decision. The oldest submissions are listed first." action={<a href={`/admin/applications/export?${new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][])}`} className={buttonClass('secondary')}><Download className="h-5 w-5" aria-hidden /> Download CSV</a>} />
      <ApplicationsList rows={list.rows} count={list.count} page={list.page} size={PAGE_SIZE} tab={tab} params={params} programmes={options.programmes} cohorts={options.cohorts} />
    </div>
  )
}
