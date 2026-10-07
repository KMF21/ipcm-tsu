import Image from 'next/image'
import { Mail } from 'lucide-react'
import { Avatar, ButtonLink, PlaceholderTag, SectionHeading } from '@/components/ui'
import { PageHero } from '@/components/site/PageHero'
import { images } from '@/lib/images'
import { placeholderPeople, type Person } from '@/lib/content'
import { createPublicClient } from '@/lib/supabase/public'
import { mediaUrl } from '@/lib/media'

export const metadata = { title: 'People', description: 'Leadership, advisory board and facilitators of the Institute of Peace and Conflict Management, TSU.' }
export const revalidate = 600

async function getPeople(): Promise<Person[]> {
  const db = createPublicClient()
  const { data } = db ? await db.from('people').select('name, role, group_name, bio, expertise, photo_path, is_placeholder').order('sort_order') : { data: null }
  const real: Person[] = (data ?? []).map((p) => ({
    name: p.name, role: p.role, group: p.group_name, bio: p.bio ?? undefined, expertise: p.expertise ?? [], placeholder: p.is_placeholder, photo: mediaUrl(p.photo_path),
  }))
  // Each section falls back to the sample list until someone is added to it.
  const groups: Person['group'][] = ['director', 'staff', 'facilitator', 'board']
  return groups.flatMap((g) => {
    const mine = real.filter((p) => p.group === g)
    return mine.length ? mine : placeholderPeople.filter((p) => p.group === g)
  })
}

function Card({ p, large }: { p: Person; large?: boolean }) {
  return (
    <article className="flex h-full flex-col rounded-card border border-line bg-white p-6 shadow-card">
      <div className="flex items-center gap-4">
        {p.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.photo} alt={`Photo of ${p.name}`} className={`${large ? 'h-20 w-20' : 'h-16 w-16'} shrink-0 rounded-full object-cover`} />
        ) : (
          <Avatar name={p.name === 'Facilitator' || p.name.startsWith('Name') ? p.role : p.name} size={large ? 80 : 64} />
        )}
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-navy">{p.name}<PlaceholderTag show={p.placeholder} /></h3>
          <p className="text-base text-ink-muted">{p.role}</p>
        </div>
      </div>
      {p.bio && <p className="mt-4 text-base text-ink">{p.bio}</p>}
      {p.expertise && p.expertise.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {p.expertise.map((e) => <li key={e} className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">{e}</li>)}
        </ul>
      )}
    </article>
  )
}

export default async function PeoplePage() {
  const people = await getPeople()
  const by = (g: Person['group']) => people.filter((p) => p.group === g)
  const director = by('director')[0]
  return (
    <>
      <PageHero eyebrow="People" crumb="People" title="Practitioners who have done this work" intro="Our facilitators have mediated disputes, run early-warning systems, led humanitarian responses and served in security agencies. They teach from experience." image={images.programmeHeroes.NMA} />

      {director && (
        <section className="section">
          <div className="container-page grid items-center gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[20px] bg-canvas lg:max-w-none">
              <Image src={images.director.src} alt={images.director.alt} fill sizes="(min-width:1024px) 440px, 100vw" className="object-cover object-top" />
            </div>
            <div>
              <SectionHeading eyebrow="Leadership" title={director.name} intro={director.bio} />
              <p className="mt-2 text-lead font-semibold text-teal">{director.role}<PlaceholderTag show={director.placeholder} /></p>
              <ButtonLink href="/about#director" variant="secondary" className="mt-6">Read the Director’s welcome</ButtonLink>
            </div>
          </div>
        </section>
      )}

      <section className="section bg-canvas">
        <div className="container-page">
          <SectionHeading eyebrow="Management" title="The team that runs the Institute" />
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {by('staff').map((p, i) => <li key={`${p.role}-${i}`}><Card p={p} /></li>)}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <SectionHeading eyebrow="Facilitators" title="Taught by people from the field" intro="Each programme is led by facilitators with practical experience in that area, supported by guest speakers from security agencies, government, traditional institutions and civil society." />
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {by('facilitator').map((p, i) => <li key={`${p.role}-${i}`}><Card p={p} /></li>)}
          </ul>
        </div>
      </section>

      <section className="section bg-navy-50">
        <div className="container-page">
          <SectionHeading eyebrow="Advisory board" title="Guidance from across the peace sector" />
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {by('board').map((p, i) => <li key={`${p.role}-${i}`}><Card p={p} /></li>)}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container-page flex flex-col items-start gap-6 rounded-card border border-line bg-white p-8 shadow-card sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-[1.5rem] font-semibold leading-8 sm:text-h2">Teach with us</h2>
            <p className="mt-3 text-lead text-ink-muted">We welcome experienced mediators, security professionals, humanitarian workers and academics as facilitators and guest speakers.</p>
          </div>
          <ButtonLink href="/contact?topic=facilitator" size="lg"><Mail className="h-5 w-5" aria-hidden /> Get in touch</ButtonLink>
        </div>
      </section>
    </>
  )
}
