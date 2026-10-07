import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Download } from 'lucide-react'
import { buttonClass } from '@/components/ui'
import { ReceiptView } from '@/components/receipts/ReceiptView'
import { PrintButton } from '@/components/receipts/PrintButton'
import { getReceipt } from '@/lib/receipts/queries'
import { qrSvg } from '@/lib/receipts/qr'
import { verifyPath } from '@/lib/receipts/types'
import { siteUrl } from '@/lib/site-url'
import { can } from '@/lib/admin/roles'
import { requireStaff } from '@/lib/admin/session'

export const metadata = { title: 'Receipt' }

export default async function StaffReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireStaff(can.money)
  const r = await getReceipt(supabase, id)
  if (!r) notFound()
  const verifyUrl = `${await siteUrl()}${verifyPath(r.verify_token)}`
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <Link href="/admin/payments" className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-navy hover:text-teal"><ArrowLeft className="h-5 w-5" aria-hidden /> Payments</Link>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href={`/admin/payments/${r.id}/pdf`} download className={buttonClass('primary', 'lg', 'w-full sm:w-auto')}><Download className="h-5 w-5" aria-hidden /> Download PDF</a>
          <PrintButton />
        </div>
      </div>
      <ReceiptView r={r} qrSvg={await qrSvg(verifyUrl)} verifyUrl={verifyUrl} />
    </div>
  )
}
