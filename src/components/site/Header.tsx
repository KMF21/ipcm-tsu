'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ChevronDown, Mail, Menu, Phone, X } from 'lucide-react'
import { images } from '@/lib/images'
import { programmes } from '@/lib/programmes'
import { site } from '@/lib/site'
import { buttonClass } from '@/components/ui'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/about', label: 'About' },
  { href: '/programmes', label: 'Programmes', children: true },
  { href: '/admissions', label: 'Admissions' },
  { href: '/people', label: 'People' },
  { href: '/research', label: 'Research' },
  { href: '/contact', label: 'Contact' },
]

export function Lockup({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label={`${site.name}, ${site.parent} — home`}>
      <Image src={images.logo.src} alt="" width={48} height={48} className="h-11 w-11 shrink-0 sm:h-12 sm:w-12" priority />
      <span className="flex flex-col leading-tight">
        <span className={cn('whitespace-nowrap font-display text-[0.95rem] font-bold leading-5 sm:text-base', light ? 'text-white' : 'text-navy')}>
          Institute of Peace and
          <br /> Conflict Management
        </span>
        <span className={cn('text-sm font-medium', light ? 'text-white/80' : 'text-ink-muted')}>Taraba State University</span>
      </span>
    </Link>
  )
}

export function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <div className="hidden bg-navy text-white md:block">
        <div className="container-page flex h-10 items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <a href={`tel:${site.phone.value.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-teal-100">
              <Phone className="h-4 w-4" aria-hidden /> {site.phone.value}
            </a>
            <a href={`mailto:${site.email.value}`} className="flex items-center gap-2 hover:text-teal-100">
              <Mail className="h-4 w-4" aria-hidden /> {site.email.value}
            </a>
          </div>
          <a href={site.tsuUrl} className="hover:text-teal-100">
            Taraba State University main site ↗
          </a>
        </div>
      </div>

      <header className={cn('sticky top-0 z-40 border-b bg-white/95 backdrop-blur transition-shadow', scrolled ? 'border-line shadow-card' : 'border-transparent')}>
        <div className={cn('container-page flex items-center justify-between gap-6 transition-[height]', scrolled ? 'h-[68px]' : 'h-20')}>
          <Lockup />

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
            {nav.map((item) =>
              item.children ? (
                <div key={item.href} className="group relative">
                  <Link href={item.href} className="flex min-h-[44px] items-center gap-1 whitespace-nowrap rounded-full px-3 text-base font-medium text-ink hover:text-teal">
                    {item.label} <ChevronDown className="h-4 w-4" aria-hidden />
                  </Link>
                  <div className="invisible absolute left-1/2 top-full w-[360px] -translate-x-1/2 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <div className="rounded-card border border-line bg-white p-2 shadow-raised">
                      {programmes.map((p) => (
                        <Link key={p.code} href={`/programmes/${p.slug}`} className="flex items-start gap-3 rounded-lg p-3 hover:bg-teal-50">
                          <span className="mt-0.5 rounded-md bg-navy px-2 py-0.5 text-sm font-bold text-white">{p.code}</span>
                          <span className="text-label font-medium text-navy">{p.shortTitle}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link key={item.href} href={item.href} className="flex min-h-[44px] items-center whitespace-nowrap rounded-full px-3 text-base font-medium text-ink hover:text-teal">
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <Link href="/login" className="min-h-[44px] whitespace-nowrap px-3 py-2.5 text-base font-semibold text-navy hover:text-teal">
              Log in
            </Link>
            <Link href="/apply" className={buttonClass('primary')}>
              Apply now
            </Link>
          </div>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full text-navy hover:bg-navy-50 lg:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={cn('fixed inset-0 z-50 lg:hidden', open ? 'pointer-events-auto' : 'pointer-events-none')} aria-hidden={!open}>
        <div className={cn('absolute inset-0 bg-navy/50 transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={() => setOpen(false)} />
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={cn('absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-white shadow-raised transition-transform duration-200', open ? 'translate-x-0' : 'translate-x-full')}
        >
          <div className="flex h-20 items-center justify-between border-b border-line px-5">
            <span className="font-display text-lg font-bold text-navy">Menu</span>
            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-navy-50" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="h-6 w-6 text-navy" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile">
            {nav.map((item) => (
              <div key={item.href}>
                <Link href={item.href} onClick={() => setOpen(false)} className="flex min-h-[52px] items-center rounded-lg px-3 text-lg font-semibold text-navy hover:bg-teal-50">
                  {item.label}
                </Link>
                {item.children && (
                  <div className="mb-2 ml-3 border-l-2 border-teal-100 pl-3">
                    {programmes.map((p) => (
                      <Link key={p.code} href={`/programmes/${p.slug}`} onClick={() => setOpen(false)} className="flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-base text-ink hover:bg-teal-50">
                        <span className="font-bold text-teal">{p.code}</span> {p.shortTitle}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="flex flex-col gap-3 border-t border-line p-5">
            <Link href="/apply" onClick={() => setOpen(false)} className={buttonClass('primary', 'lg', 'w-full')}>
              Apply now
            </Link>
            <Link href="/login" onClick={() => setOpen(false)} className={buttonClass('secondary', 'lg', 'w-full')}>
              Log in
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
