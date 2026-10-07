import { MailCheck, KeyRound } from 'lucide-react'
import { Alert, ButtonLink } from '@/components/ui'
import { AuthHeading } from '@/components/auth/AuthHeading'
import { ConfirmForm } from '@/components/auth/ConfirmForm'

export const metadata = { title: 'Confirm your email' }

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { token_hash: tokenHash, type = 'email' } = await searchParams
  const recovery = type === 'recovery'
  const Icon = recovery ? KeyRound : MailCheck
  return (
    <>
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal"><Icon className="h-8 w-8" aria-hidden /></span>
      <AuthHeading
        title={recovery ? 'Reset your password' : 'Confirm your email'}
        intro={recovery ? 'Press the button to continue and choose a new password.' : 'One last step. Press the button to activate your IPCM account.'}
      />
      {tokenHash ? (
        <ConfirmForm tokenHash={tokenHash} type={type} />
      ) : (
        <div className="space-y-4">
          <Alert tone="error" title="This link is incomplete">Open the link directly from your email, or request a new one.</Alert>
          <ButtonLink href="/login" size="lg" className="w-full">Go to log in</ButtonLink>
        </div>
      )}
    </>
  )
}
