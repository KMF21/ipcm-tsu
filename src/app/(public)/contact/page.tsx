import { Clock, ExternalLink, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { PlaceholderTag } from '@/components/ui'
import { PageHero } from '@/components/site/PageHero'
import { ContactForm } from '@/components/contact/ContactForm'
import { site } from '@/lib/site'

export const metadata = { title: 'Contact', description: 'Contact the Institute of Peace and Conflict Management, Taraba State University, Jalingo.' }

const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Taraba State University, Jalingo')}`

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams
  const wa = site.whatsapp.value.replace(/[^\d]/g, '')
  const cards = [
    { Icon: MapPin, title: 'Visit', lines: [site.address.value], placeholder: site.address.placeholder, link: { href: mapUrl, label: 'Open in Google Maps', external: true } },
    { Icon: Phone, title: 'Call', lines: [site.phone.value], placeholder: site.phone.placeholder, link: { href: `tel:${site.phone.value.replace(/\s/g, '')}`, label: 'Call now' } },
    { Icon: MessageCircle, title: 'WhatsApp', lines: [site.whatsapp.value], placeholder: site.whatsapp.placeholder, link: { href: `https://wa.me/${wa}`, label: 'Chat on WhatsApp', external: true } },
    { Icon: Mail, title: 'Email', lines: [`General: ${site.email.value}`, `Admissions: ${site.admissionsEmail.value}`], placeholder: site.email.placeholder, link: { href: `mailto:${site.admissionsEmail.value}`, label: 'Email admissions' } },
  ]
  return (
    <>
      <PageHero eyebrow="Contact" crumb="Contact" title="Talk to us" intro="Questions about a programme, your application, sponsoring staff or working with the Institute? Send a message and we reply within two working days." />

      <section className="section">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.35fr] lg:gap-14">
          <div className="space-y-4">
            {cards.map(({ Icon, title, lines, placeholder, link }) => (
              <article key={title} className="flex gap-4 rounded-card border border-line bg-white p-5 shadow-card">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal"><Icon className="h-6 w-6" aria-hidden /></span>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-navy">{title}<PlaceholderTag show={placeholder} /></h2>
                  {lines.map((l) => <p key={l} className="break-words text-base text-ink">{l}</p>)}
                  <a href={link.href} {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="mt-1 inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-teal hover:underline">
                    {link.label}{link.external && <ExternalLink className="h-4 w-4" aria-hidden />}
                  </a>
                </div>
              </article>
            ))}
            <article className="flex gap-4 rounded-card bg-navy p-5 text-white">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-teal-100"><Clock className="h-6 w-6" aria-hidden /></span>
              <div>
                <h2 className="text-lg font-semibold text-white">Office hours<PlaceholderTag show={site.hours.placeholder} /></h2>
                <p className="text-base text-white/85">{site.hours.value}</p>
              </div>
            </article>
          </div>

          <div className="rounded-card border border-line bg-white p-6 shadow-card sm:p-8">
            <h2 className="text-[1.5rem] font-semibold leading-8 sm:text-h3">Send a message</h2>
            <p className="mt-2 text-base text-ink-muted">Already applied? Sign in to your portal to see your application status first.</p>
            <div className="mt-6"><ContactForm topic={topic} /></div>
          </div>
        </div>
      </section>
    </>
  )
}
