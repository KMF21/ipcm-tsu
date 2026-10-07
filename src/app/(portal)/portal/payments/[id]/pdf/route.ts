import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getReceipt } from '@/lib/receipts/queries'
import { buildReceiptPdf } from '@/lib/receipts/pdf'
import { verifyPath } from '@/lib/receipts/types'
import { siteUrl } from '@/lib/site-url'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL(`/login?next=/portal/payments/${id}`, req.url))

  const receipt = await getReceipt(supabase, id)
  if (!receipt) return new NextResponse('Receipt not found', { status: 404 })

  const pdf = await buildReceiptPdf(receipt, `${await siteUrl()}${verifyPath(receipt.verify_token)}`)
  const inline = req.nextUrl.searchParams.get('view') === '1'
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="IPCM-Receipt-${receipt.receipt_no}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
