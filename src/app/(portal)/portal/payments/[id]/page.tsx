import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Download } from 'lucide-react'
import { Alert, ButtonLink } from '@/components/ui'
import { ReceiptView } from '@/components/receipts/ReceiptView'
import { PrintButton } from '@/components/receipts/PrintButton'
import { createClient } from '@/lib/supabase/server'
import { getReceipt } from '@/lib/receipts/queries'
import { qrSvg } from '@/lib/receipts/qr'
import { verifyPath } from '@/lib/receipts/types'
import { siteUrl } from '@/lib/site-url'
import { buttonClass } from '@/components/ui'

export const metadata = { title: 'Receipt', robots: { index: false } }

export default async function ReceiptPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/portal/payments/${id}`)
  const r = await getReceipt(supabase, id)
  if (!r) notFound()

  const verifyUrl = `${await siteUrl()}${verifyPath(r.verify_token)}`
  const svg = await qrSvg(verifyUrl)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <ButtonLink href="/portal/payments" variant="ghost" className="self-start px-3"><ArrowLeft className="h-5 w-5" aria-hidden /> All payments</ButtonLink>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href={`/portal/payments/${r.id}/pdf`} className={buttonClass('primary', 'lg', 'w-full sm:w-auto')} download>
            <Download className="h-5 w-5" aria-hidden /> Download PDF
          </a>
          <PrintButton />
        </div>
      </div>
      {sp.new && (
        <div className="mb-5 print:hidden">
          <Alert tone="success" title="Payment received. Here is your receipt.">Download it or keep this page. You can find all your receipts under Payments at any time.</Alert>
        </div>
      )}
      <ReceiptView r={r} qrSvg={svg} verifyUrl={verifyUrl} />
    </div>
  )
}
