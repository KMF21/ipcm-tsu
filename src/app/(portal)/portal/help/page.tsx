import { Mail, MessageCircle, Phone } from 'lucide-react'
import { Accordion, ButtonLink, Card } from '@/components/ui'
import { PortalHeader } from '@/components/portal/PortalHeader'
import { faqGroups } from '@/lib/content'
import { site } from '@/lib/site'

export const metadata = { title: 'Help' }

export default function HelpPage() {
  const wa = site.whatsapp.value.replace(/[^\d]/g, '')
  const items = faqGroups.flatMap((g) => (g.id === 'applying' || g.id === 'fees' || g.id === 'account' ? g.items : [])).slice(0, 10)
  return (
    <div className="mx-auto max-w-4xl">
      <PortalHeader title="Help" intro="Quick answers, and how to reach the admissions office." />
      <div className="grid gap-4 sm:grid-cols-3">
        <a href={`mailto:${site.admissionsEmail.value}`} className="rounded-card border border-line bg-white p-5 shadow-card hover:border-teal">
          <Mail className="h-6 w-6 text-teal" aria-hidden /><p className="mt-3 font-semibold text-navy">Email admissions</p><p className="break-all text-sm text-ink-muted">{site.admissionsEmail.value}</p>
        </a>
        <a href={`tel:${site.phone.value.replace(/\s/g, '')}`} className="rounded-card border border-line bg-white p-5 shadow-card hover:border-teal">
          <Phone className="h-6 w-6 text-teal" aria-hidden /><p className="mt-3 font-semibold text-navy">Call</p><p className="text-sm text-ink-muted">{site.phone.value}</p>
        </a>
        <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="rounded-card border border-line bg-white p-5 shadow-card hover:border-teal">
          <MessageCircle className="h-6 w-6 text-teal" aria-hidden /><p className="mt-3 font-semibold text-navy">WhatsApp</p><p className="text-sm text-ink-muted">{site.whatsapp.value}</p>
        </a>
      </div>
      <h2 className="mt-8 text-h3 font-semibold">Common questions</h2>
      <div className="mt-4"><Accordion items={items} /></div>
      <Card className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-lg font-semibold text-navy">Still stuck?</h2><p className="text-base text-ink-muted">Send us a message and include your application number. We reply within two working days.</p></div>
        <ButtonLink href="/contact">Send a message</ButtonLink>
      </Card>
    </div>
  )
}
