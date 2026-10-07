import Image from 'next/image'
import { BookOpen, Compass, Handshake, Lightbulb, Quote, Scale, Search, ShieldCheck, Sprout, Target, Users } from 'lucide-react'
import { Avatar, ButtonLink, PlaceholderTag, SectionHeading } from '@/components/ui'
import { PageHero } from '@/components/site/PageHero'
import { images } from '@/lib/images'
import { FORMAT, programmes } from '@/lib/programmes'
import { site } from '@/lib/site'
import { audiences, directorWelcome, identity, mandate, mission, values, vision } from '@/lib/content'

export const metadata = {
  title: 'About the Institute',
  description: 'Vision, mission and mandate of the Institute of Peace and Conflict Management, Taraba State University.',
}

const mandateIcons = [BookOpen, Search, Scale, Handshake]
const valueIcons = [ShieldCheck, Users, Lightbulb, Target, Sprout]

export default function AboutPage() {
  const facts = [
    { value: String(programmes.length), label: 'certificate programmes' },
    { value: `${FORMAT.durationWeeks} weeks`, label: 'per programme, on Saturdays' },
    { value: String(FORMAT.contactHours), label: 'contact hours' },
    { value: `Up to ${FORMAT.cohortSize}`, label: 'participants per class' },
  ]
  return (
    <>
      <PageHero eyebrow="About the Institute" crumb="About" title="Practical peace education for the people who manage conflict every day" intro={identity} image={images.about} />

      {/* At a glance */}
      <section aria-label="At a glance" className="border-b border-line bg-white">
        <dl className="container-page grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="sr-only">{f.label}</dt>
              <dd className="font-display text-[1.75rem] font-bold leading-9 text-navy sm:text-stat">{f.value}</dd>
              <dd className="mt-1 text-base text-ink-muted">{f.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Vision and mission */}
      <section className="section">
        <div className="container-page grid gap-6 lg:grid-cols-2">
          <article className="rounded-card bg-navy p-7 text-white sm:p-10">
            <Compass className="h-9 w-9 text-teal-100" aria-hidden />
            <h2 className="mt-5 text-label font-semibold uppercase tracking-[0.08em] text-teal-100">Our vision</h2>
            <p className="mt-3 font-display text-[1.375rem] font-medium leading-9 text-white sm:text-[1.625rem] sm:leading-10">{vision}</p>
          </article>
          <article className="rounded-card border border-line bg-white p-7 shadow-card sm:p-10">
            <Target className="h-9 w-9 text-teal" aria-hidden />
            <h2 className="mt-5 text-label font-semibold uppercase tracking-[0.08em] text-teal">Our mission</h2>
            <p className="mt-3 text-lead text-ink">{mission}</p>
          </article>
        </div>
      </section>

      {/* Mandate */}
      <section className="section bg-canvas">
        <div className="container-page">
          <SectionHeading eyebrow="Mandate" title="What the Institute exists to do" />
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {mandate.map((m, i) => {
              const Icon = mandateIcons[i]
              return (
                <li key={m.title} className="rounded-card bg-white p-6 shadow-card">
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal"><Icon className="h-6 w-6" aria-hidden /></span>
                    <span className="font-display text-sm font-bold text-ink-muted">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{m.title}</h3>
                  <p className="mt-2 text-base text-ink-muted">{m.body}</p>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* Director's welcome */}
      <section className="section" id="director">
        <div className="container-page grid items-start gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-14">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-canvas lg:sticky lg:top-28">
            <Image src={images.about.src} alt={images.about.alt} fill sizes="(min-width:1024px) 440px, 100vw" className="object-cover" />
          </div>
          <div>
            <SectionHeading eyebrow="Director’s welcome" title="What you learn on Saturday, you can use on Monday" />
            <figure className="mt-8">
              <Quote className="h-10 w-10 text-teal" aria-hidden />
              <blockquote className="mt-4 space-y-5">
                <p className="font-display text-[1.25rem] font-medium leading-8 text-navy sm:text-[1.5rem] sm:leading-10">{directorWelcome[0]}</p>
                {directorWelcome.slice(1).map((p) => <p key={p.slice(0, 20)} className="text-lead text-ink">{p}</p>)}
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-4 border-t border-line pt-6">
                <Avatar name={site.director.name} size={56} />
                <div>
                  <p className="font-semibold text-navy">{site.director.name}<PlaceholderTag show={site.director.placeholder} /></p>
                  <p className="text-label text-ink-muted">{site.director.title}</p>
                </div>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section bg-navy-50">
        <div className="container-page">
          <SectionHeading eyebrow="Core values" title="How we work" align="center" />
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {values.map((v, i) => {
              const Icon = valueIcons[i]
              return (
                <li key={v.title} className="rounded-card bg-white p-6 shadow-card">
                  <Icon className="h-8 w-8 text-teal" aria-hidden />
                  <h3 className="mt-4 text-lg font-semibold">{v.title}</h3>
                  <p className="mt-2 text-base text-ink-muted">{v.body}</p>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* Who we serve */}
      <section className="section">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Who we serve" title="Built for working adults on the front line of conflict" intro="Every programme answers one question: what will I be able to do after this course? The capstone makes sure of it: each participant analyses a real conflict or designs an intervention for their own workplace or community." />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/programmes" size="lg">Explore programmes</ButtonLink>
              <ButtonLink href="/people" variant="secondary" size="lg">Meet our people</ButtonLink>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {audiences.map((a) => (
              <li key={a} className="flex min-h-[64px] items-center rounded-card border border-line bg-canvas px-5 text-base font-semibold text-navy">{a}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-teal">
        <div className="container-page flex flex-col items-center gap-6 py-16 text-center">
          <h2 className="max-w-2xl text-[1.75rem] font-semibold leading-9 text-white sm:text-h2">Learn with us, and help build a more peaceful Taraba</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/register" variant="light" size="lg">Apply now</ButtonLink>
            <ButtonLink href="/contact" size="lg" className="border border-white/60 bg-transparent hover:bg-white/10">Partner with the Institute</ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}
