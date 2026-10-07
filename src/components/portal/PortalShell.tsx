'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileText,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Search,
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[88px] flex-col border-r border-line bg-white md:flex lg:w-[272px]" aria-label="Portal navigation">
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

      <div className="md:pl-[88px] lg:pl-[272px]">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 md:hidden">
              <Image src={images.logo.src} alt="TSU" width={36} height={36} className="h-9 w-9" />
              <span className="font-display text-base font-bold text-navy">IPCM Portal</span>
            </div>
            <label className="relative hidden max-w-md flex-1 md:block">
              <span className="sr-only">Search</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" aria-hidden />
              <input type="search" placeholder="Search modules, materials, payments" className="h-12 w-full rounded-full border border-line bg-canvas pl-12 pr-4 text-base focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/25" />
            </label>
            <div className="flex items-center gap-2">
              <button className="relative flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-navy hover:bg-canvas" aria-label="Notifications, 2 unread">
                <Bell className="h-5 w-5" aria-hidden />
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-crimson px-1 text-[0.8125rem] font-bold text-white">2</span>
              </button>
              <Link href="/portal/profile" className="md:hidden" aria-label="Profile">
                <Avatar name={user.name} size={44} />
              </Link>
            </div>
          </div>
        </header>

        <main id="main" className="px-4 pb-28 pt-6 sm:px-6 md:pb-12 lg:px-8 lg:pt-8">{children}</main>
      </div>

      {/* Bottom tab bar (phone) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Portal">
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
