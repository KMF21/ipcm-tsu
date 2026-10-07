import type { Metadata } from 'next'
import { AdminShell } from '@/components/admin/AdminShell'
import { getStaff } from '@/lib/admin/session'

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · IPCM Admin' }, robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { staff } = await getStaff()
  return <AdminShell user={staff}>{children}</AdminShell>
}
