import Image from 'next/image'
import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'
import { images } from '@/lib/images'
import { programmes } from '@/lib/programmes'
import { site } from '@/lib/site'

export function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="container-page grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <div className="flex items-center gap-3">
            <Image src={images.logo.src} alt="" width={52} height={52} className="h-[52px] w-[52px] rounded-full bg-white p-0.5" />
            <p className="font-display text-lg font-bold leading-snug">
              Institute of Peace and
              <br /> Conflict Management
            </p>
          </div>
          <p className="mt-5 max-w-xs text-base text-white/80">
            Practical training, research and partnership for peace in Taraba State, Nigeria and beyond.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-white">Programmes</h2>
          <ul className="mt-4 space-y-2.5">
            {programmes.map((p) => (
              <li key={p.code}>
                <Link href={`/programmes/${p.slug}`} className="text-base text-white/80 hover:text-white">
                  {p.shortTitle}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-white">Quick links</h2>
          <ul className="mt-4 space-y-2.5">
            {[
              ['/admissions', 'Admissions'],
              ['/verify', 'Verify a certificate'],
              ['/faq', 'FAQ'],
              ['/login', 'Student login'],
              [site.tsuUrl, 'Taraba State University'],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-base text-white/80 hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-white">Contact</h2>
          <ul className="mt-4 space-y-3.5 text-base text-white/80">
            <li className="flex gap-3">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-teal-100" aria-hidden />
              <span>Taraba State University, ATC, 660213, Jalingo, Taraba State, Nigeria</span>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-1 h-5 w-5 shrink-0 text-teal-100" aria-hidden />
              <a href={`tel:${site.phone.value.replace(/\s/g, '')}`} className="hover:text-white">{site.phone.value}</a>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-1 h-5 w-5 shrink-0 text-teal-100" aria-hidden />
              <a href={`mailto:${site.email.value}`} className="break-all hover:text-white">{site.email.value}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Taraba State University. All rights reserved.</p>
          <p>
            <Link href="/privacy" className="hover:text-white">Privacy policy</Link>
            <span className="mx-2">·</span>Part of Taraba State University
          </p>
        </div>
      </div>
    </footer>
  )
}
