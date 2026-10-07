import { PaymentsList } from '@/components/admin/PaymentsList'
import { PageHeader } from '@/components/admin/bits'
import { PAGE_SIZE, listPayments } from '@/lib/admin/queries'
import { can } from '@/lib/admin/roles'
import { requireStaff } from '@/lib/admin/session'

export const metadata = { title: 'Payments' }

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const { supabase } = await requireStaff(can.money)
  const params = { status: ['pending', 'failed', 'all'].includes(sp.status ?? '') ? sp.status : undefined, q: sp.q || undefined, type: sp.type || undefined }
  const list = await listPayments(supabase, { ...params, page: Number(sp.page) || 1 })
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Bursary" title="Payments" intro="Every Paystack payment. Open a paid one to see, print or download its receipt." />
      <PaymentsList rows={list.rows} count={list.count} page={list.page} size={PAGE_SIZE} params={params} />
    </div>
  )
}
