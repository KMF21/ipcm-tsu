import Image from 'next/image'
import { Building2, FileSearch, Handshake, Landmark, Megaphone, Scale } from 'lucide-react'
import { ButtonLink, PlaceholderTag, SectionHeading } from '@/components/ui'
import { PageHero } from '@/components/site/PageHero'
import { images } from '@/lib/images'
import { POST_KIND, placeholderPosts, researchThemes, type Post } from '@/lib/content'
import { createPublicClient } from '@/lib/supabase/public'
import { formatDate } from '@/lib/utils'
import { mediaUrl } from '@/lib/media'

export const metadata = { title: 'Research and advisory', description: 'Research, policy briefs and advisory services of the Institute of Peace and Conflict Management, TSU.' }
export const revalidate = 600

async function getPosts(): Promise<Post[]> {
  const db = createPublicClient()
  if (!db) return placeholderPosts
  const { data } = await db.from('posts').select('kind, title, excerpt, published_at, is_placeholder, pdf_path, author').not('published_at', 'is', null).order('published_at', { ascending: false }).limit(9)
  if (!data?.length) return placeholderPosts
  return data.map((p) => ({ kind: p.kind, title: p.title, excerpt: p.excerpt ?? '', date: p.published_at ?? undefined, placeholder: p.is_placeholder, pdf: mediaUrl(p.pdf_path) ?? undefined, author: p.author ?? undefined }))
}

const services = [
  { Icon: Scale, title: 'Mediation support', body: 'Neutral facilitation for communities, institutions and organisations in dispute.' },
  { Icon: FileSearch, title: 'Conflict assessments', body: 'Conflict and stakeholder analysis before a project, election or intervention.' },
  { Icon: Building2, title: 'Custom training', body: 'Programmes adapted for a ministry, agency, NGO or company, delivered to your team.' },
  { Icon: Megaphone, title: 'Dialogue and convening', body: 'Designing and hosting dialogues between communities, government and security actors.' },
]

export default async function ResearchPage() {
  const posts = await getPosts()
  return (
    <>
      <PageHero eyebrow="Research and advisory" crumb="Research" title="Evidence for peace in our region" intro="We study the causes, dynamics and resolution of conflict in the North-East and Middle Belt, and put what we learn to work for government, traditional institutions, security agencies and civil society." image={images.research[0]} />

      <section className="section">
        <div className="container-page">
          <SectionHeading eyebrow="Focus areas" title="What we study" />
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {researchThemes.map((t, i) => (
              <li key={t.title} className="rounded-card border border-line bg-white p-6 shadow-card">
                <span className="font-display text-sm font-bold text-teal">0{i + 1}</span>
                <h3 className="mt-3 text-lg font-semibold">{t.title}</h3>
                <p className="mt-2 text-base text-ink-muted">{t.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section bg-canvas">
        <div className="container-page">
          <SectionHeading eyebrow="Publications" title="Briefs, reports and research notes" intro="Short, practical writing for people who make decisions about peace and security." />
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {posts.map((p, i) => (
              <li key={p.title} className="overflow-hidden rounded-card border border-line bg-white shadow-card">
                <div className="relative aspect-[16/10]">
                  <Image src={images.research[i % 3].src} alt={images.research[i % 3].alt} fill sizes="(min-width:768px) 380px, 100vw" className="object-cover" />
                </div>
                <div className="p-6">
                  <p className="text-sm font-semibold uppercase tracking-wide text-teal">{POST_KIND[p.kind] ?? p.kind}<PlaceholderTag show={p.placeholder} /></p>
                  <h3 className="mt-2 text-lg font-semibold leading-snug">{p.title}</h3>
                  <p className="mt-2 text-base text-ink-muted">{p.excerpt}</p>
                  {(p.date || p.author) && <p className="mt-3 text-sm text-ink-muted">{[p.author, p.date && formatDate(p.date)].filter(Boolean).join(' · ')}</p>}
                  {p.pdf && <a href={p.pdf} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-teal hover:underline">Read the PDF</a>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <SectionHeading eyebrow="Advisory services" title="Work with the Institute" intro="Our staff and facilitators support organisations that need practical help with conflict." />
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map(({ Icon, title, body }) => (
              <li key={title} className="rounded-card border border-line bg-white p-6 shadow-card">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal"><Icon className="h-6 w-6" aria-hidden /></span>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-base text-ink-muted">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section bg-navy text-white">
        <div className="container-page grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-label font-semibold uppercase tracking-[0.08em] text-teal-100">Partnerships</p>
            <h2 className="mt-2 text-[1.5rem] font-semibold leading-8 text-white sm:text-h2">Research, train or convene with us</h2>
            <p className="mt-4 text-lead text-white/85">We partner with government agencies, development partners, universities and civil society on research, training and dialogue.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <ButtonLink href="/contact?topic=partnership" variant="light" size="lg"><Handshake className="h-5 w-5" aria-hidden /> Propose a partnership</ButtonLink>
            <ButtonLink href="/contact?topic=advisory" size="lg" className="border border-white/60 bg-transparent hover:bg-white/10"><Landmark className="h-5 w-5" aria-hidden /> Request advisory</ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}
