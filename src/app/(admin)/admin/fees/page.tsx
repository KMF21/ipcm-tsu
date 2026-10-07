import { Fees } from '@/components/admin/Fees'
import { PageHeader } from '@/components/admin/bits'
import { Alert } from '@/components/ui'
import { listFees } from '@/lib/admin/queries'
import { can } from '@/lib/admin/roles'
import { requireStaff } from '@/lib/admin/session'

export const metadata = { title: 'Fees' }

export default async function FeesPage() {
  const { supabase, staff } = await requireStaff(can.manageFees)
  const fees = await listFees(supabase)
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Bursary" title="Fees" intro="Amounts in naira. The processing charge is added on top and shown separately on receipts." />
      <div className="mb-5"><Alert tone="info" title="Changes apply to new payments only">Anyone who has already started paying keeps the amount they were shown. Every change is recorded with your name.</Alert></div>
      <Fees fees={fees} canEdit={can.manageFees(staff.role)} />
    </div>
  )
}
