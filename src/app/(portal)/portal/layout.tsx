import type { Metadata } from 'next'
import { PortalShell } from '@/components/portal/PortalShell'
import { demoStudent } from '@/lib/demo'

export const metadata: Metadata = { title: 'Student portal', robots: { index: false, follow: false } }

// Phase 0 preview: uses demo data. Phase 1 replaces this with the signed-in Supabase user.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell user={demoStudent}>{children}</PortalShell>
}
