import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { images } from '@/lib/images'

export const metadata = { robots: { index: false, follow: true } }

const points = ['Five professional certificates', 'Eight Saturdays per programme', 'A Taraba State University certificate']

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Brand panel (desktop) */}
      <aside className="relative hidden overflow-hidden bg-navy lg:sticky lg:top-0 lg:block lg:h-screen">
        <Image src={images.hero.src} alt="" fill priority sizes="50vw" className="object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/70 via-navy/80 to-navy" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-10 text-white xl:p-12">
          <Link href="/" className="flex items-center gap-3">
            <Image src={images.logo.src} alt="" width={52} height={52} className="h-[52px] w-[52px] rounded-full bg-white p-0.5" />
            <span className="font-display text-lg font-bold leading-snug">
              Institute of Peace and
              <br /> Conflict Management
            </span>
          </Link>
          <div>
            <p className="font-display text-[2.5rem] font-bold leading-[3rem]">
              Practical peace.
              <br />
              <span className="text-teal-100">Lasting impact.</span>
            </p>
            <ul className="mt-8 space-y-3">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-3 text-lead text-white/90">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-teal-100" aria-hidden /> {p}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-white/70">Taraba State University, Jalingo</p>
        </div>
      </aside>

      {/* Form panel */}
      <main id="main" className="flex min-h-screen flex-col lg:min-h-0">
        <div className="flex items-center justify-between px-4 py-3 sm:px-8 lg:hidden">
          <Link href="/" className="flex items-center gap-3">
            <Image src={images.logo.src} alt="" width={44} height={44} className="h-11 w-11" />
            <span className="font-display text-base font-bold leading-tight text-navy">
              Institute of Peace and
              <br /> Conflict Management
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-start justify-center px-4 pb-6 pt-2 sm:px-8 lg:items-center lg:py-6">
          <div className="w-full max-w-[460px]">{children}</div>
        </div>
        <p className="px-4 pb-5 text-center text-sm text-ink-muted">
          <Link href="/" className="hover:text-teal">← Back to the institute website</Link>
        </p>
      </main>
    </div>
  )
}
