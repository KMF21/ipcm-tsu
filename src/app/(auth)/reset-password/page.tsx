import { AuthHeading } from '@/components/auth/AuthHeading'
import { ResetForm } from '@/components/auth/SimpleForms'

export const metadata = { title: 'Set a new password' }

export default function ResetPasswordPage() {
  return (
    <>
      <AuthHeading title="Set a new password" intro="Choose a password you haven’t used before." />
      <ResetForm />
    </>
  )
}
