import { PageHero } from '@/components/site/PageHero'
import { site } from '@/lib/site'

export const metadata = { title: 'Privacy policy', description: 'How the Institute of Peace and Conflict Management, TSU, collects, uses and protects personal data.' }

const updated = '7 October 2026'

const sections: { id: string; title: string; body: React.ReactNode }[] = [
  { id: 'who', title: 'Who we are', body: <p>{site.name} is part of {site.parent} (“we”, “us”). We are responsible for the personal data you give us through this website, the applicant and student portal, and our emails. We handle it in line with the Nigeria Data Protection Act 2023 and the regulations of the Nigeria Data Protection Commission.</p> },
  { id: 'collect', title: 'What we collect', body: (
    <ul>
      <li><strong>Account details:</strong> your name, email address, phone number and password (stored only in scrambled form).</li>
      <li><strong>Application details:</strong> date of birth, sex, state and LGA, address, National Identification Number if you give it, work and education history, sponsorship details and your personal statement.</li>
      <li><strong>Documents:</strong> your passport photograph, certificates or results, means of identification and, where relevant, CV and sponsorship letter.</li>
      <li><strong>Payments:</strong> the amount, date, payment method and Paystack reference. We do not see or store your card details; Paystack handles them.</li>
      <li><strong>Study records:</strong> attendance, scores, results and certificates once you are a student.</li>
      <li><strong>Messages:</strong> what you send us through the contact form or by email.</li>
      <li><strong>Technical data:</strong> sign-in records and basic security logs needed to keep the service safe.</li>
    </ul>
  ) },
  { id: 'why', title: 'Why we use it', body: (
    <ul>
      <li>To assess your application, make admission decisions and issue your registration number, admission letter and certificate (to take steps at your request before a contract, and to perform it).</li>
      <li>To take payments and issue receipts.</li>
      <li>To run classes, record attendance and results, and award certificates.</li>
      <li>To contact you about your application and studies, including reminders.</li>
      <li>To let employers and others confirm that a receipt, letter or certificate is genuine when you show it to them (the check page shows only the minimum: name, programme, dates and number).</li>
      <li>To meet our legal and regulatory duties as a public university, and to keep the platform secure.</li>
    </ul>
  ) },
  { id: 'share', title: 'Who we share it with', body: (
    <>
      <p>We do not sell your data. We share it only with:</p>
      <ul>
        <li>Staff of the Institute and {site.parent} who need it for their work (for example, admissions and bursary).</li>
        <li>Service providers who process it on our behalf under contract: Paystack (payments), Supabase (secure database and file storage), Vercel (website hosting) and Resend (email delivery). Some of these store data outside Nigeria with safeguards required by law.</li>
        <li>Your sponsor, if your organisation is paying, limited to your application and attendance status.</li>
        <li>Authorities, where the law requires it.</li>
      </ul>
    </>
  ) },
  { id: 'keep', title: 'How long we keep it', body: <p>Application records of applicants who are not admitted are kept for two years after the intake, then deleted. Student records, results and certificate records are kept permanently, as university academic records, so that certificates can always be verified. Payment records are kept for the period required by financial regulations.</p> },
  { id: 'security', title: 'How we protect it', body: <p>Data is encrypted in transit and at rest. Documents are stored privately and opened by staff only through short-lived links. Access is limited by role and every staff decision is recorded. Verification links use random codes that cannot be guessed.</p> },
  { id: 'rights', title: 'Your rights', body: (
    <>
      <p>You can ask us to:</p>
      <ul>
        <li>give you a copy of the data we hold about you;</li>
        <li>correct data that is wrong or incomplete;</li>
        <li>delete data we no longer need, or stop or limit how we use it;</li>
        <li>move your data to another organisation where the law allows.</li>
      </ul>
      <p>You can also complain to the Nigeria Data Protection Commission. We will respond to requests within the time the law sets.</p>
    </>
  ) },
  { id: 'cookies', title: 'Cookies', body: <p>We use only the cookies needed to keep you signed in and to keep the site secure. We do not use advertising or tracking cookies.</p> },
  { id: 'contact', title: 'Contact us', body: <p>For any privacy question or request, write to <a href={`mailto:${site.email.value}`}>{site.email.value}</a> or to the address on our contact page, marked “Data protection”.</p> },
]

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" crumb="Privacy policy" title="Privacy policy" intro={`How we collect, use and protect your personal data. Last updated ${updated}.`} />
      <section className="section">
        <div className="container-page grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
          <nav aria-label="On this page" className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">On this page</p>
            <ul className="space-y-1">
              {sections.map((s) => <li key={s.id}><a href={`#${s.id}`} className="block rounded-xl px-3 py-2 text-base text-navy hover:bg-teal-50">{s.title}</a></li>)}
            </ul>
          </nav>
          <article className="prose-ipcm min-w-0 max-w-3xl space-y-10">
            {process.env.NEXT_PUBLIC_APP_ENV !== 'production' && (
              <p className="rounded-card border border-amber/40 bg-amber-50 p-4 text-base text-ink">Draft for review by the Institute and TSU’s legal or data protection officer before launch.</p>
            )}
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                <h2 className="text-[1.375rem] font-semibold leading-8 sm:text-h3">{s.title}</h2>
                <div className="mt-3 space-y-3 text-base leading-7 text-ink [&_a]:font-semibold [&_a]:text-teal [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">{s.body}</div>
              </section>
            ))}
          </article>
        </div>
      </section>
    </>
  )
}
