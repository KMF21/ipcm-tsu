import Link from 'next/link'
import { AuthHeading } from '@/components/auth/AuthHeading'
import { ForgotForm } from '@/components/auth/SimpleForms'

export const metadata = { title: 'Reset your password' }

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading title="Forgot your password?" intro="Enter the email you registered with and we’ll send you a link to set a new password." />
      <ForgotForm />
      <p className="mt-8 border-t border-line pt-6 text-center text-base text-ink-muted">
        Remembered it? <Link href="/login" className="font-semibold text-teal hover:underline">Log in</Link>
      </p>
    </>
  )
}
