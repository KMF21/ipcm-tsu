import Link from 'next/link'
import { AuthHeading } from '@/components/auth/AuthHeading'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { getProgramme, programmes } from '@/lib/programmes'

export const metadata = { title: 'Create an account' }

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const p = programmes.find((x) => x.code === sp.programme) ?? (sp.programme ? getProgramme(sp.programme) : undefined)
  const next = sp.next ?? (p ? `/portal/apply?programme=${p.code}` : '/portal/apply')
  return (
    <>
      <AuthHeading
        title="Create your account"
        intro={p ? <>You’re applying for <strong className="text-navy">{p.shortTitle}</strong>. Start with an account so you can save and return to your application.</> : 'Start with an account. You can save your application and come back to it at any time.'}
      />
      <RegisterForm next={next} />
      <p className="mt-6 border-t border-line pt-5 text-center text-base text-ink-muted">
        Already have an account?{' '}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-teal hover:underline">Log in</Link>
      </p>
    </>
  )
}
