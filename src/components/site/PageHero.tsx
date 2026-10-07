import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import type { SiteImage } from '@/lib/images'

/** Navy hero for inner pages, with breadcrumb and an optional photo. */
export function PageHero({ eyebrow, title, intro, image, crumb, children }: { eyebrow: string; title: string; intro?: string; image?: SiteImage; crumb: string; children?: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden bg-navy text-white">
      {image && (
        <>
          <Image src={image.src} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-30" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/95 to-navy/50" aria-hidden />
        </>
      )}
      <div className="container-page py-12 sm:py-20">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-label text-white/80">
          <Link href="/" className="hover:text-white">Home</Link>
          <ChevronRight className="h-4 w-4" aria-hidden />
          <span className="text-white">{crumb}</span>
        </nav>
        <p className="mt-8 text-label font-semibold uppercase tracking-[0.08em] text-teal-100">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-[1.875rem] font-bold leading-[2.375rem] text-white sm:text-h1">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-lead text-white/90">{intro}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  )
}
