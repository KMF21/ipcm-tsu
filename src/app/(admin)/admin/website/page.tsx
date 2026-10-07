import { ExternalLink } from 'lucide-react'
import { PageHeader, Tabs } from '@/components/admin/bits'
import { AddPanel, PeopleList, PersonForm, PostForm, PostsList, type EditPerson, type EditPost } from '@/components/admin/WebsiteEditor'
import { can } from '@/lib/admin/roles'
import { requireStaff } from '@/lib/admin/session'
import { mediaUrl } from '@/lib/media'

export const metadata = { title: 'Website' }

export default async function WebsitePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const tab = (await searchParams).tab === 'research' ? 'research' : 'people'
  const { supabase } = await requireStaff(can.editContent)
  let body: React.ReactNode
  if (tab === 'people') {
    const { data } = await supabase.from('people').select('id, name, role, group_name, bio, expertise, sort_order, photo_path').order('group_name').order('sort_order')
    const people: EditPerson[] = (data ?? []).map((p) => ({ ...p, expertise: p.expertise ?? [], photo: mediaUrl(p.photo_path) }))
    body = (
      <div className="space-y-4">
        <AddPanel title="Add a person"><PersonForm /></AddPanel>
        <PeopleList people={people} />
      </div>
    )
  } else {
    const { data } = await supabase.from('posts').select('id, kind, title, excerpt, author, published_at, pdf_path').order('published_at', { ascending: false, nullsFirst: true })
    const posts: EditPost[] = (data ?? []).map((p) => ({ ...p, pdf: mediaUrl(p.pdf_path) }))
    body = (
      <div className="space-y-4">
        <AddPanel title="Add a brief, report or news item"><PostForm /></AddPanel>
        <PostsList posts={posts} />
      </div>
    )
  }
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Content" title="Website" intro="Update the People and Research pages. Changes appear on the website within a minute." action={<a href={tab === 'people' ? '/people' : '/research'} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-teal hover:underline">View page <ExternalLink className="h-4 w-4" aria-hidden /></a>} />
      <Tabs current={tab} items={[{ key: 'people', label: 'People', href: '/admin/website' }, { key: 'research', label: 'Research', href: '/admin/website?tab=research' }]} />
      <div className="mt-6">{body}</div>
    </div>
  )
}
