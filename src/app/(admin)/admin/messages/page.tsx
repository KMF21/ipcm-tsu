import { Mail, Phone, Reply } from 'lucide-react'
import { Button } from '@/components/ui'
import { PageHeader, Tabs } from '@/components/admin/bits'
import { can } from '@/lib/admin/roles'
import { requireStaff } from '@/lib/admin/session'
import { setMessageStatus } from '@/lib/admin/staff-actions'
import { CONTACT_TOPICS } from '@/lib/contact/topics'
import { formatDateTime } from '@/lib/receipts/types'

export const metadata = { title: 'Messages' }

const STATUS = [
  { key: 'new', label: 'New' },
  { key: 'replied', label: 'Replied' },
  { key: 'closed', label: 'Closed' },
]

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: raw } = await searchParams
  const status = STATUS.some((s) => s.key === raw) ? raw! : 'new'
  const { supabase } = await requireStaff(can.messages)
  const { data } = await supabase.from('contact_messages').select('id, name, email, phone, topic, message, status, created_at').eq('status', status).order('created_at', { ascending: status === 'new' }).limit(100)
  const msgs = data ?? []
  const topic = (v: string) => CONTACT_TOPICS.find((t) => t.value === v)?.label ?? v
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Inbox" title="Messages" intro="Messages sent through the website’s contact form. Reply by email, then mark them replied." />
      <Tabs current={status} items={STATUS.map((s) => ({ key: s.key, label: s.label, href: `/admin/messages?status=${s.key}` }))} />
      {msgs.length === 0 ? (
        <p className="mt-6 rounded-card border border-dashed border-line bg-white p-6 text-base text-ink-muted">No {status} messages.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {msgs.map((m) => (
            <li key={m.id} className="rounded-card border border-line bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold text-navy">{m.name}</p>
                  <p className="text-sm text-ink-muted">{topic(m.topic)} · {formatDateTime(m.created_at)}</p>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-base text-ink">{m.message}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: your message to the Institute (${topic(m.topic)})`)}`} className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-teal hover:underline"><Reply className="h-4 w-4" aria-hidden />Reply to {m.email}</a>
                {m.phone && <a href={`tel:${m.phone}`} className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-teal hover:underline"><Phone className="h-4 w-4" aria-hidden />{m.phone}</a>}
                <div className="ml-auto flex gap-2">
                  {m.status !== 'replied' && (
                    <form action={setMessageStatus}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="status" value="replied" /><Button type="submit" variant="secondary"><Mail className="h-4 w-4" aria-hidden /> Mark replied</Button></form>
                  )}
                  {m.status !== 'closed' && (
                    <form action={setMessageStatus}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="status" value="closed" /><Button type="submit" variant="ghost">Close</Button></form>
                  )}
                  {m.status !== 'new' && (
                    <form action={setMessageStatus}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="status" value="new" /><Button type="submit" variant="ghost">Move to new</Button></form>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
