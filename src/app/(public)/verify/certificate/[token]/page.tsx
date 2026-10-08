import { VerifyCertificateResult } from '@/components/receipts/VerifyCertificateResult'
import { createClient } from '@/lib/supabase/server'
import { checkCertificate } from '@/lib/certificates/queries'

export const metadata = { title: 'Certificate verification', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function VerifyCertificatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { r, photoUrl } = await checkCertificate(await createClient(), token)
  return <VerifyCertificateResult r={r} photoUrl={photoUrl} />
}
