import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getReceipt } from './queries'
import { buildReceiptPdf } from './pdf'
import { verifyPath } from './types'
import { siteUrl } from '@/lib/site-url'

/** Streams a receipt PDF to the payer or to Bursary staff (the database decides who may see it). */
export async function receiptPdfResponse(req: NextRequest, id: string, loginNext: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(loginNext)}`, req.url))
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
