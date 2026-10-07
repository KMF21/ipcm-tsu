import Link from 'next/link'
import { Alert } from '@/components/ui'
import { AuthHeading } from '@/components/auth/AuthHeading'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = { title: 'Log in' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  return (
    <>
      <AuthHeading title="Welcome back" intro="Log in to your IPCM account to continue your application or studies." />
      <div className="mb-6 space-y-3">
        {sp.reset && <Alert tone="success" title="Password updated">Log in with your new password.</Alert>}
        {sp.signedout && <Alert tone="info" title="You’ve been logged out" />}
        {sp.error === 'link' && <Alert tone="info" title="That link couldn’t be used">If you already confirmed your email, just log in below. Otherwise, sign up again or request a new link.</Alert>}
      </div>
      <LoginForm next={sp.next} />
      <p className="mt-6 border-t border-line pt-5 text-center text-base text-ink-muted">
        New to IPCM?{' '}
        <Link href={sp.next ? `/register?next=${encodeURIComponent(sp.next)}` : '/register'} className="font-semibold text-teal hover:underline">Create an account</Link>
      </p>
    </>
  )
}
