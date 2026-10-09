import { MessageCircleQuestion } from 'lucide-react'
import { Accordion, ButtonLink } from '@/components/ui'
import { PageHero } from '@/components/site/PageHero'
import { buildFaqGroups } from '@/lib/content'
import { feeTotal, getPublicFees } from '@/lib/fees-public'
import { formatNaira } from '@/lib/utils'

export const metadata = { title: 'Frequently asked questions', description: 'Answers about applying, fees, classes, certificates and your account at the Institute of Peace and Conflict Management, TSU.' }

export const revalidate = 600

export default async function FaqPage() {
  const fees = await getPublicFees()
  const faqGroups = buildFaqGroups(formatNaira(feeTotal(fees.application)), formatNaira(feeTotal(fees.tuition)))
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqGroups.flatMap((g) => g.items).map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero eyebrow="Help" crumb="FAQ" title="Frequently asked questions" intro="Short answers to the questions applicants and students ask most." />
      <section className="section">
        <div className="container-page grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
          <nav aria-label="FAQ topics" className="lg:sticky lg:top-28 lg:self-start">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Topics</p>
            <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {faqGroups.map((g) => (
                <li key={g.id}>
                  <a href={`#${g.id}`} className="inline-flex min-h-[44px] items-center rounded-full border border-line px-4 text-base font-medium text-navy hover:border-teal hover:text-teal lg:w-full lg:rounded-xl lg:border-0 lg:px-3 lg:hover:bg-teal-50">{g.title}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="min-w-0 space-y-12">
            {faqGroups.map((g) => (
              <section key={g.id} id={g.id} className="scroll-mt-28" aria-labelledby={`${g.id}-h`}>
                <h2 id={`${g.id}-h`} className="mb-4 text-[1.5rem] font-semibold leading-8 sm:text-h3">{g.title}</h2>
                <Accordion items={g.items} />
              </section>
            ))}
            <div className="flex flex-col items-start gap-4 rounded-card bg-navy-50 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="flex items-start gap-3">
                <MessageCircleQuestion className="mt-0.5 h-7 w-7 shrink-0 text-teal" aria-hidden />
                <div>
                  <h2 className="text-lg font-semibold text-navy">Still have a question?</h2>
                  <p className="text-base text-ink-muted">The admissions office replies within two working days.</p>
                </div>
              </div>
              <ButtonLink href="/contact">Contact us</ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
