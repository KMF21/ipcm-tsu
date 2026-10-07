import Image from 'next/image'
import Link from 'next/link'
import {
  Award,
  BadgeCheck,
  BookOpenCheck,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Globe2,
  GraduationCap,
  Quote,
  Users,
} from 'lucide-react'
import { Accordion, ButtonLink, PlaceholderTag, SectionHeading } from '@/components/ui'
import { ProgrammeCard } from '@/components/site/ProgrammeCard'
import { images } from '@/lib/images'
import { FEES, programmes } from '@/lib/programmes'
import { site } from '@/lib/site'
import { formatDate, formatNaira } from '@/lib/utils'

const values = [
  { Icon: Users, title: 'Taught by practitioners', body: 'Facilitators who have mediated, negotiated and built peace in real communities.' },
  { Icon: CalendarClock, title: 'Built for working adults', body: 'Eight Saturdays per programme. Keep your job and your commitments.' },
  { Icon: BadgeCheck, title: 'A TSU certificate', body: 'Awarded by Taraba State University, with a unique number anyone can verify online.' },
  { Icon: Globe2, title: 'Local roots, global standard', body: 'Indigenous approaches to peace alongside international best practice.' },
]

const steps = [
  { Icon: FileText, title: 'Apply online', body: `Create an account, complete the form and pay the ${formatNaira(FEES.application.base + FEES.application.processing)} application fee.` },
  { Icon: ClipboardCheck, title: 'Get admitted', body: 'We review your application and send an offer by email and in your portal.' },
  { Icon: BookOpenCheck, title: 'Learn', body: 'Attend eight Saturdays, complete four modules and a practical capstone.' },
  { Icon: GraduationCap, title: 'Get certified', body: 'Receive your TSU certificate with a QR code for instant verification.' },
]

const faqs = [
  { q: 'Who can apply?', a: "Anyone with five O'Level credits including English, or anyone aged 25 and above with at least two years of relevant work or community experience." },
  { q: 'How much does a programme cost?', a: `The application fee is ${formatNaira(FEES.application.base + FEES.application.processing)} and tuition is ${formatNaira(FEES.tuition.base + FEES.tuition.processing)}. Each includes a ₦300 processing charge.` },
  { q: 'When do classes hold?', a: 'On Saturdays, 9:00am to 4:00pm, for eight weeks. Materials and recordings are available in your student portal.' },
  { q: 'Can my organisation sponsor several staff?', a: 'Yes. Organisations can nominate staff and pay with a single invoice. Contact the admissions office to arrange it.' },
]

export default function HomePage() {
  const intake = site.nextIntake
  return (
    <>
      {/* 1. Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="container-page grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-20">
          <div className="text-center lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-label font-semibold text-teal-700">
              <span className="h-2 w-2 rounded-full bg-teal" aria-hidden /> Taraba State University
            </p>
            <h1 className="mt-6 text-[2.125rem] font-bold leading-[2.625rem] sm:text-[2.75rem] sm:leading-[3.25rem] lg:text-display">
              Practical peace.
              <br />
              <span className="text-teal">Lasting impact.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lead text-ink-muted lg:mx-0">
              Professional certificate programmes that equip security officers, public servants, community and faith leaders, and NGO workers to prevent, manage and resolve conflict.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <ButtonLink href="/register" size="lg">Apply now</ButtonLink>
              <ButtonLink href="/programmes" variant="secondary" size="lg">View programmes</ButtonLink>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] shadow-raised">
              <Image src={images.hero.src} alt={images.hero.alt} fill priority sizes="(min-width:1024px) 560px, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/40 to-transparent" aria-hidden />
            </div>
            <div className="relative mx-4 -mt-8 flex items-center gap-3 rounded-card bg-white p-4 text-left shadow-raised sm:absolute sm:-bottom-6 sm:right-6 sm:mx-0 sm:mt-0">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal">
                <Award className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="font-semibold text-navy">Certified by Taraba State University</p>
                <p className="text-sm text-ink-muted">Every certificate verifiable online</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Next intake strip */}
      <section aria-label="Next intake" className="mt-10 bg-navy text-white">
        <div className="container-page flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <p className="font-display text-lg font-semibold">
              Next intake: {intake.label}
              
            </p>
            <p className="text-base text-white/85">Apply by {formatDate(intake.deadline)}</p>
            <p className="text-base text-white/85">{intake.seatsLeft} seats per programme</p>
          </div>
          <ButtonLink href="/register" variant="light">Start your application</ButtonLink>
        </div>
      </section>

      {/* 3. Programmes */}
      <section className="section bg-canvas">
        <div className="container-page">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading eyebrow="Programmes" title="Five certificates. One purpose." intro="Each programme runs for eight Saturdays, with four modules and a practical capstone you can use at work the next Monday." />
            <ButtonLink href="/programmes" variant="secondary" className="self-start sm:self-auto">Compare all programmes</ButtonLink>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {programmes.map((p) => (
              <ProgrammeCard key={p.code} p={p} />
            ))}
            <div className="flex flex-col justify-between rounded-card bg-teal p-7 text-white shadow-card">
              <div>
                <h3 className="text-h3 font-semibold text-white">Not sure which to choose?</h3>
                <p className="mt-3 text-base text-white/90">Start with Peace and Conflict Management, our foundation course, or talk to the admissions office about your role.</p>
              </div>
              <div className="mt-6 flex flex-col gap-3">
                <ButtonLink href="/programmes/peace-conflict-management" variant="light">See the foundation course</ButtonLink>
                <Link href="/contact" className="text-center font-semibold text-white underline-offset-4 hover:underline">Talk to admissions</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Why IPCM */}
      <section className="section">
        <div className="container-page">
          <SectionHeading eyebrow="Why IPCM" title="Training that changes what people do" align="center" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ Icon, title, body }) => (
              <div key={title} className="rounded-card border border-line p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-base text-ink-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. How it works */}
      <section className="section bg-navy-50">
        <div className="container-page">
          <SectionHeading eyebrow="How it works" title="From application to certificate in four steps" />
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ Icon, title, body }, i) => (
              <li key={title} className="relative rounded-card bg-white p-6 shadow-card">
                <span className="font-display text-sm font-bold text-teal">STEP {i + 1}</span>
                <Icon className="mt-4 h-8 w-8 text-navy" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-base text-ink-muted">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 6. Impact numbers — hidden until real figures exist (spec). */}

      {/* 7. Director's message */}
      <section className="section">
        <div className="container-page grid items-center gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[20px] bg-canvas lg:max-w-none">
            <Image src={images.director.src} alt={images.director.alt} fill sizes="(min-width:1024px) 440px, 100vw" className="object-cover object-top" />
          </div>
          <figure>
            <Quote className="h-10 w-10 text-teal" aria-hidden />
            <blockquote className="mt-4 font-display text-[1.375rem] font-medium leading-9 text-navy sm:text-[1.625rem] sm:leading-10">
              Peace is not the absence of conflict. It is the presence of people and institutions able to handle conflict without violence. Our programmes are short, practical and taught by people who have done this work.
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-4">
              <Image src={images.directorHeadshot.src} alt="" width={52} height={52} className="h-[52px] w-[52px] rounded-full object-cover" />
              <div>
                <p className="font-semibold text-navy">
                  {site.director.name}
                
                </p>
                <p className="text-label text-ink-muted">{site.director.title}</p>
              </div>
            </figcaption>
            <Link href="/about" className="mt-6 inline-block font-semibold text-teal underline-offset-4 hover:underline">Read the Director’s welcome</Link>
          </figure>
        </div>
      </section>

      {/* 8. Research and insights */}
      <section className="section bg-canvas">
        <div className="container-page">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading eyebrow="Research and insights" title="Evidence for peace in our region" />
            <ButtonLink href="/research" variant="secondary" className="self-start sm:self-auto">All research</ButtonLink>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              ['Policy brief', 'Farmer-herder relations in southern Taraba: what works for prevention'],
              ['Event report', 'Community dialogue on youth and peace in Jalingo'],
              ['Research note', 'Early warning in practice: lessons from local peace committees'],
            ].map(([kind, title], i) => (
              <Link key={title} href="/research" className="group overflow-hidden rounded-card border border-line bg-white shadow-card transition hover:shadow-raised">
                <div className="relative aspect-[16/10]">
                  <Image src={images.research[i].src} alt={images.research[i].alt} fill sizes="(min-width:768px) 380px, 100vw" className="object-cover" />
                </div>
                <div className="p-6">
                  <p className="text-sm font-semibold uppercase tracking-wide text-teal">
                    {kind}
                    <PlaceholderTag />
                  </p>
                  <h3 className="mt-2 text-lg font-semibold leading-snug group-hover:text-teal">{title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ preview */}
      <section className="section">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <SectionHeading eyebrow="Questions" title="What applicants ask us" intro="Short answers to the questions we hear most. Our admissions office is happy to help with anything else." />
            <ButtonLink href="/faq" variant="secondary" className="mt-6">See all FAQs</ButtonLink>
          </div>
          <Accordion items={faqs} />
        </div>
      </section>

      {/* 10. Closing CTA */}
      <section className="bg-teal">
        <div className="container-page flex flex-col items-center gap-6 py-16 text-center">
          <h2 className="max-w-2xl text-[1.75rem] font-semibold leading-9 text-white sm:text-h2">Ready to build peace where you work and live?</h2>
          <p className="max-w-xl text-lead text-white/90">Applications for the {intake.label} are open.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/register" variant="light" size="lg">Apply now</ButtonLink>
            <ButtonLink href="/admissions" size="lg" className="border border-white/60 bg-transparent hover:bg-white/10">How admissions work</ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}
