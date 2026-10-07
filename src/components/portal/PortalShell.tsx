'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileText,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  UserRound,
} from 'lucide-react'
import { images } from '@/lib/images'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { signOut } from '@/lib/auth/actions'

const nav = [
  { group: 'Learning', items: [
    { href: '/portal', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/portal/programme', label: 'My programme', Icon: BookOpen },
    { href: '/portal/schedule', label: 'Schedule', Icon: CalendarDays },
    { href: '/portal/attendance', label: 'Attendance', Icon: ClipboardCheck },
    { href: '/portal/results', label: 'Results', Icon: GraduationCap },
  ] },
  { group: 'Account', items: [
    { href: '/portal/payments', label: 'Payments', Icon: CreditCard },
    { href: '/portal/documents', label: 'Documents', Icon: FileText },
    { href: '/portal/profile', label: 'Profile', Icon: UserRound },
    { href: '/portal/help', label: 'Help', Icon: HelpCircle },
  ] },
]

const tabs = [
  { href: '/portal', label: 'Home', Icon: LayoutDashboard },
  { href: '/portal/programme', label: 'Modules', Icon: BookOpen },
  { href: '/portal/schedule', label: 'Schedule', Icon: CalendarDays },
  { href: '/portal/payments', label: 'Payments', Icon: CreditCard },
  { href: '/portal/profile', label: 'Profile', Icon: UserRound },
]

export type PortalUser = { name: string; regNo: string; programmeCode: string }

export function PortalShell({ user, children }: { user: PortalUser; children: ReactNode }) {
  const path = usePathname()
  return (
    <div className="min-h-screen bg-canvas">
      {/* Sidebar: full at lg+, icon-only md–lg, hidden on phone */}
      <aside className="print:hidden fixed inset-y-0 left-0 z-30 hidden w-[88px] flex-col border-r border-line bg-white md:flex lg:w-[272px]" aria-label="Portal navigation">
        <Link href="/" className="flex h-20 items-center gap-3 px-6 lg:px-6">
          <Image src={images.logo.src} alt="TSU" width={40} height={40} className="h-10 w-10" />
          <span className="hidden font-display text-lg font-bold text-navy lg:inline">IPCM Portal</span>
        </Link>

        <div className="mx-4 hidden items-center gap-3 rounded-card border border-line p-3 lg:flex">
          <Avatar name={user.name} size={44} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-navy">{user.name}</p>
            <p className="break-all text-sm text-ink-muted">{user.regNo}</p>
          </div>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto px-3 lg:px-4">
          {nav.map((g) => (
            <div key={g.group} className="mb-4">
              <p className="mb-2 hidden px-3 text-sm font-semibold uppercase tracking-wide text-ink-muted lg:block">{g.group}</p>
              <ul className="space-y-1">
                {g.items.map(({ href, label, Icon }) => {
                  const active = path === href
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        aria-current={active ? 'page' : undefined}
                        title={label}
                        className={cn(
                          'flex min-h-[46px] items-center justify-center gap-3 rounded-xl px-3 text-base font-medium transition lg:justify-start',
                          active ? 'bg-teal-50 font-semibold text-teal-700' : 'text-ink hover:bg-canvas',
                        )}
                      >
                        <Icon className="h-[22px] w-[22px] shrink-0" aria-hidden />
                        <span className="hidden lg:inline">{label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-line p-3 lg:p-4">
          <form action={signOut}>
            <button type="submit" className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl px-3 text-base font-medium text-ink hover:bg-canvas lg:justify-start" title="Log out">
              <LogOut className="h-[22px] w-[22px]" aria-hidden />
              <span className="hidden lg:inline">Log out</span>
            </button>
          </form>
        </div>
      </aside>

      <div className="md:pl-[88px] lg:pl-[272px] print:!pl-0">
        {/* Top bar */}
        <header className="print:hidden sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 md:hidden">
              <Image src={images.logo.src} alt="TSU" width={36} height={36} className="h-9 w-9" />
              <span className="font-display text-base font-bold text-navy">IPCM Portal</span>
            </div>
            <p className="hidden min-w-0 truncate text-base text-ink-muted md:block">
              Signed in as <span className="font-semibold text-navy">{user.name}</span>
            </p>
            <div className="flex items-center gap-2">
              <details className="relative md:hidden">
                <summary className="list-none rounded-full [&::-webkit-details-marker]:hidden" aria-label="Account menu">
                  <Avatar name={user.name} size={44} />
                </summary>
                <div className="absolute right-0 top-[52px] z-40 w-64 rounded-card border border-line bg-white p-2 shadow-raised">
                  <div className="border-b border-line px-3 pb-3 pt-2">
                    <p className="truncate font-semibold text-navy">{user.name}</p>
                    <p className="break-all text-sm text-ink-muted">{user.regNo}</p>
                  </div>
                  <Link href="/portal/profile" className="mt-1 flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-base text-ink hover:bg-canvas">
                    <UserRound className="h-5 w-5" aria-hidden /> Profile
                  </Link>
                  <form action={signOut}>
                    <button type="submit" className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 text-base font-semibold text-crimson hover:bg-crimson-50">
                      <LogOut className="h-5 w-5" aria-hidden /> Sign out
                    </button>
                  </form>
                </div>
              </details>
            </div>
          </div>
        </header>

        <main id="main" className="print:p-0 px-4 pb-28 pt-6 sm:px-6 md:pb-12 lg:px-8 lg:pt-8">{children}</main>
      </div>

      {/* Bottom tab bar (phone) */}
      <nav className="print:hidden fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Portal">
        <ul className="grid grid-cols-5">
          {tabs.map(({ href, label, Icon }) => {
            const active = path === href
            return (
              <li key={href}>
                <Link href={href} aria-current={active ? 'page' : undefined} className={cn('flex min-h-[64px] flex-col items-center justify-center gap-1 text-sm font-medium', active ? 'text-teal' : 'text-ink-muted')}>
                  <Icon className="h-6 w-6" aria-hidden />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
