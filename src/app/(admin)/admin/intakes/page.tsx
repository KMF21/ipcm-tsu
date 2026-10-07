import { Intakes } from '@/components/admin/Intakes'
import { PageHeader } from '@/components/admin/bits'
import { listCohorts } from '@/lib/admin/queries'
import { can } from '@/lib/admin/roles'
import { requireStaff } from '@/lib/admin/session'

export const metadata = { title: 'Intakes' }

export default async function IntakesPage() {
  const { supabase, staff } = await requireStaff(can.seeIntakes)
  const [cohorts, { data: programmes }] = await Promise.all([
    listCohorts(supabase),
    supabase.from('programmes').select('id, code, short_title').order('code'),
  ])
  const canEdit = can.manageIntakes(staff.role)
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Programmes" title="Intakes" intro={canEdit ? 'Open or close an intake, set its dates and seats. Seats taken counts admitted students and offers that haven’t lapsed.' : 'Dates and seats for each intake. Only the Director can change them.'} />
      <Intakes cohorts={cohorts} programmes={programmes ?? []} canEdit={canEdit} />
    </div>
  )
}
