import { MailCheck } from 'lucide-react'
import Link from 'next/link'
import { AuthHeading } from '@/components/auth/AuthHeading'
import { ResendForm } from '@/components/auth/SimpleForms'

export const metadata = { title: 'Confirm your email' }

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email = '' } = await searchParams
  return (
    <>
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal"><MailCheck className="h-8 w-8" aria-hidden /></span>
      <AuthHeading
        title="Check your email"
        intro={<>We’ve sent a confirmation link to {email ? <strong className="break-all text-navy">{email}</strong> : 'your email address'}. Open it on this device to activate your account.</>}
      />
      <ul className="mb-8 space-y-2 rounded-card bg-canvas p-5 text-base text-ink">
        <li>• The email comes from Taraba State University and can take a few minutes.</li>
        <li>• Check your spam or promotions folder if you can’t see it.</li>
        <li>• The link works once and expires after 24 hours.</li>
      </ul>
      {email && <ResendForm email={email} />}
      <p className="mt-8 text-center text-base text-ink-muted">
        Wrong email? <Link href="/register" className="font-semibold text-teal hover:underline">Start again</Link>
      </p>
    </>
  )
}
