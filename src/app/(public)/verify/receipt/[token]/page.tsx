import { VerifyResult } from '@/components/receipts/VerifyResult'
import { createClient } from '@/lib/supabase/server'
import { checkReceipt } from '@/lib/receipts/queries'

export const metadata = { title: 'Receipt verification', robots: { index: false, follow: false } }

export default async function VerifyReceiptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  return <VerifyResult r={await checkReceipt(supabase, token)} />
}
