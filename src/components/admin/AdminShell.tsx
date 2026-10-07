'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { CalendarRange, ClipboardList, CreditCard, ExternalLink, Globe, Inbox, LayoutDashboard, LifeBuoy, LogOut, UsersRound, Wallet } from 'lucide-react'
import { images } from '@/lib/images'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { signOut } from '@/lib/auth/actions'
import { can, ROLE_LABEL, type Role } from '@/lib/admin/roles'

type Item = { href: string; label: string; short: string; Icon: typeof LayoutDashboard; show: (r: Role) => boolean }

const items: Item[] = [
  { href: '/admin', label: 'Dashboard', short: 'Home', Icon: LayoutDashboard, show: () => true },
  { href: '/admin/applications', label: 'Applications', short: 'Applications', Icon: ClipboardList, show: can.review },
  { href: '/admin/payments', label: 'Payments', short: 'Payments', Icon: CreditCard, show: can.money },
  { href: '/admin/intakes', label: 'Intakes', short: 'Intakes', Icon: CalendarRange, show: can.seeIntakes },
  { href: '/admin/fees', label: 'Fees', short: 'Fees', Icon: Wallet, show: can.manageFees },
  { href: '/admin/help', label: 'Applicant help', short: 'Help', Icon: LifeBuoy, show: can.helpApplicants },
  { href: '/admin/messages', label: 'Messages', short: 'Messages', Icon: Inbox, show: can.messages },
  { href: '/admin/website', label: 'Website', short: 'Website', Icon: Globe, show: can.editContent },
  { href: '/admin/staff', label: 'Staff accounts', short: 'Staff', Icon: UsersRound, show: can.manageStaff },
]

export function AdminShell({ user, children }: { user: { name: string; email: string; role: Role }; children: ReactNode }) {
  const path = usePathname()
  const mine = items.filter((i) => i.show(user.role))
  const active = (href: string) => (href === '/admin' ? path === '/admin' : path.startsWith(href))
  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[88px] flex-col border-r border-line bg-white md:flex lg:w-[264px] print:hidden" aria-label="Admin navigation">
        <Link href="/admin" className="flex h-20 items-center gap-3 px-6">
          <Image src={images.logo.src} alt="TSU" width={40} height={40} className="h-10 w-10" />
          <span className="hidden leading-tight lg:block">
            <span className="block font-display text-lg font-bold text-navy">IPCM Admin</span>
          </span>
        </Link>
        <nav className="mt-2 flex-1 overflow-y-auto px-3 lg:px-4">
          <ul className="space-y-1">
            {mine.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  title={label}
                  aria-current={active(href) ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[46px] items-center justify-center gap-3 rounded-xl px-3 text-base font-medium transition lg:justify-start',
                    active(href) ? 'bg-teal-50 font-semibold text-teal-700' : 'text-ink hover:bg-canvas',
                  )}
                >
                  <Icon className="h-[22px] w-[22px] shrink-0" aria-hidden />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <a href="/" target="_blank" rel="noreferrer" className="mt-4 flex min-h-[46px] items-center justify-center gap-3 rounded-xl px-3 text-base text-ink-muted hover:bg-canvas lg:justify-start" title="View website">
            <ExternalLink className="h-5 w-5 shrink-0" aria-hidden />
            <span className="hidden lg:inline">View website</span>
          </a>
        </nav>
        <div className="border-t border-line p-3 lg:p-4">
          <div className="mb-2 hidden items-center gap-3 px-1 lg:flex">
            <Avatar name={user.name} size={40} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-navy">{user.name}</p>
              <p className="text-sm text-ink-muted">{ROLE_LABEL[user.role]}</p>
            </div>
          </div>
          <form action={signOut}>
            <button type="submit" title="Sign out" className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl px-3 text-base font-medium text-ink hover:bg-canvas lg:justify-start">
              <LogOut className="h-[22px] w-[22px]" aria-hidden />
              <span className="hidden lg:inline">Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      <div className="md:pl-[88px] lg:pl-[264px] print:!pl-0">
        {/* Phone top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-white/95 px-4 backdrop-blur md:hidden print:hidden">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Image src={images.logo.src} alt="TSU" width={36} height={36} className="h-9 w-9" />
            <span className="font-display text-base font-bold text-navy">IPCM Admin</span>
          </Link>
          <details className="relative">
            <summary className="list-none rounded-full [&::-webkit-details-marker]:hidden" aria-label="Account menu">
              <Avatar name={user.name} size={40} />
            </summary>
            <div className="absolute right-0 top-[50px] z-40 w-64 rounded-card border border-line bg-white p-2 shadow-raised">
              <div className="border-b border-line px-3 pb-3 pt-2">
                <p className="truncate font-semibold text-navy">{user.name}</p>
                <p className="text-sm text-ink-muted">{ROLE_LABEL[user.role]}</p>
              </div>
              {mine.slice(5).map(({ href, label, Icon }) => (
                <Link key={href} href={href} className="mt-1 flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-base text-ink hover:bg-canvas">
                  <Icon className="h-5 w-5" aria-hidden /> {label}
                </Link>
              ))}
              <form action={signOut}>
                <button type="submit" className="mt-1 flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 text-base font-semibold text-crimson hover:bg-crimson-50">
                  <LogOut className="h-5 w-5" aria-hidden /> Sign out
                </button>
              </form>
            </div>
          </details>
        </header>
        <main id="main" className="px-4 pb-28 pt-6 sm:px-6 md:pb-12 lg:px-10 lg:pt-10 print:p-0">{children}</main>
      </div>

      {/* Phone tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden print:hidden" aria-label="Admin">
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(mine.length, 5)}, minmax(0, 1fr))` }}>
          {mine.slice(0, 5).map(({ href, short, Icon }) => (
            <li key={href}>
              <Link href={href} aria-current={active(href) ? 'page' : undefined} className={cn('flex min-h-[64px] flex-col items-center justify-center gap-1 px-1 text-center text-sm font-medium', active(href) ? 'text-teal' : 'text-ink-muted')}>
                <Icon className="h-6 w-6" aria-hidden />
                <span className="truncate">{short}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
