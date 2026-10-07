import { VerifyLetterResult } from '@/components/receipts/VerifyLetterResult'
import { createClient } from '@/lib/supabase/server'
import { checkLetter } from '@/lib/letters/queries'

export const metadata = { title: 'Admission letter verification', robots: { index: false, follow: false } }

export default async function VerifyLetterPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  return <VerifyLetterResult r={await checkLetter(supabase, token)} />
}
