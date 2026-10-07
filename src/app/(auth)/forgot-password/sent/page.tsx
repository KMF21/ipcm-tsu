import { MailCheck } from 'lucide-react'
import { ButtonLink } from '@/components/ui'
import { AuthHeading } from '@/components/auth/AuthHeading'

export const metadata = { title: 'Check your email' }

export default async function ResetSentPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams
  return (
    <>
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal"><MailCheck className="h-8 w-8" aria-hidden /></span>
      <AuthHeading
        title="Check your email"
        intro={<>If an account exists for {email ? <strong className="break-all text-navy">{email}</strong> : 'that address'}, you’ll receive a password reset link shortly. The link expires after one hour.</>}
      />
      <ButtonLink href="/login" variant="secondary" size="lg" className="w-full">Back to log in</ButtonLink>
    </>
  )
}
