'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Plus, Trash2 } from 'lucide-react'
import { Alert, Avatar, Badge, Button, Field, Input, Select, Textarea } from '@/components/ui'
import { deletePerson, deletePost, savePerson, savePost } from '@/lib/admin/content-actions'
import type { ActionState } from '@/lib/admin/actions'

export type EditPerson = { id: string; name: string; role: string; group_name: string; bio: string | null; expertise: string[]; sort_order: number; photo: string | null }
export type EditPost = { id: string; kind: string; title: string; excerpt: string | null; author: string | null; published_at: string | null; pdf: string | null }

const GROUP_LABEL: Record<string, string> = { director: 'Director', staff: 'Management', facilitator: 'Facilitator', board: 'Advisory board' }
const KIND_LABEL: Record<string, string> = { policy_brief: 'Policy brief', publication: 'Publication', event_report: 'Event report', research_note: 'Research note', news: 'News' }

function Save({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return <Button type="submit" loading={pending} className="w-full sm:w-auto">{label}</Button>
}

function Remove({ action, id, what }: { action: (fd: FormData) => Promise<void>; id: string; what: string }) {
  return (
    <form action={action} onSubmit={(e) => { if (!confirm(`Remove ${what} from the website?`)) e.preventDefault() }}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" className="text-crimson hover:bg-crimson-50"><Trash2 className="h-4 w-4" aria-hidden /> Remove</Button>
    </form>
  )
}

export function PersonForm({ p }: { p?: EditPerson }) {
  const [s, action] = useActionState<ActionState, FormData>(savePerson, {})
  const k = p?.id ?? 'new'
  return (
    <form action={action} className="space-y-4" key={s.ok && !p ? Math.random() : k}>
      {p && <input type="hidden" name="id" value={p.id} />}
      {s.error && <Alert tone="error" title={s.error} />}
      {s.ok && <Alert tone="success" title={s.message ?? 'Saved'} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`pn-${k}`} label="Full name with title" required><Input id={`pn-${k}`} name="name" defaultValue={p?.name} placeholder="Dr. Amina Bello" required /></Field>
        <Field id={`pr-${k}`} label="Role or position" required><Input id={`pr-${k}`} name="role" defaultValue={p?.role} placeholder="Programmes Coordinator" required /></Field>
        <Field id={`pg-${k}`} label="Section" required>
          <Select id={`pg-${k}`} name="group_name" defaultValue={p?.group_name ?? 'staff'}>{Object.entries(GROUP_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
        </Field>
        <Field id={`po-${k}`} label="Order" hint="Lower numbers appear first"><Input id={`po-${k}`} name="sort_order" type="number" min={0} max={999} defaultValue={p?.sort_order ?? 10} /></Field>
      </div>
      <Field id={`pb-${k}`} label="Short bio" hint="Two or three sentences"><Textarea id={`pb-${k}`} name="bio" defaultValue={p?.bio ?? ''} rows={3} className="min-h-[96px]" /></Field>
      <Field id={`pe-${k}`} label="Areas of expertise" hint="Separate with commas, e.g. Mediation, Early warning"><Input id={`pe-${k}`} name="expertise" defaultValue={p?.expertise.join(', ')} /></Field>
      <Field id={`pp-${k}`} label={p?.photo ? 'Replace photo' : 'Photo'} hint="JPG or PNG, up to 4 MB. We crop it to a square around the face.">
        <input id={`pp-${k}`} name="photo" type="file" accept="image/jpeg,image/png" className="block w-full text-base file:mr-4 file:min-h-[44px] file:rounded-full file:border-0 file:bg-teal-50 file:px-4 file:font-semibold file:text-teal-700" />
      </Field>
      <Save label={p ? 'Save changes' : 'Add person'} />
    </form>
  )
}

export function PeopleList({ people }: { people: EditPerson[] }) {
  return (
    <ul className="divide-y divide-line rounded-card border border-line bg-white shadow-card">
      {people.length === 0 && <li className="p-5 text-base text-ink-muted">No one added yet. Until you add people, the website shows the sample list.</li>}
      {people.map((p) => (
        <li key={p.id} className="p-5">
          <div className="flex flex-wrap items-center gap-4">
            {p.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photo} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : <Avatar name={p.name} size={56} />}
            <div className="min-w-0 flex-1"><p className="font-semibold text-navy">{p.name}</p><p className="text-sm text-ink-muted">{p.role}</p></div>
            <Badge tone="neutral">{GROUP_LABEL[p.group_name]}</Badge>
            <Remove action={deletePerson} id={p.id} what={p.name} />
          </div>
          <details className="mt-3 rounded-xl border border-line">
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center px-4 font-semibold text-teal [&::-webkit-details-marker]:hidden">Edit</summary>
            <div className="border-t border-line p-4"><PersonForm p={p} /></div>
          </details>
        </li>
      ))}
    </ul>
  )
}

export function PostForm({ p }: { p?: EditPost }) {
  const [s, action] = useActionState<ActionState, FormData>(savePost, {})
  const k = p?.id ?? 'new'
  return (
    <form action={action} className="space-y-4" key={s.ok && !p ? Math.random() : k}>
      {p && <input type="hidden" name="id" value={p.id} />}
      {s.error && <Alert tone="error" title={s.error} />}
      {s.ok && <Alert tone="success" title={s.message ?? 'Saved'} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`tk-${k}`} label="Type" required>
          <Select id={`tk-${k}`} name="kind" defaultValue={p?.kind ?? 'policy_brief'}>{Object.entries(KIND_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
        </Field>
        <Field id={`ta-${k}`} label="Author"><Input id={`ta-${k}`} name="author" defaultValue={p?.author ?? ''} placeholder="IPCM Research Team" /></Field>
      </div>
      <Field id={`tt-${k}`} label="Title" required><Input id={`tt-${k}`} name="title" defaultValue={p?.title} required /></Field>
      <Field id={`te-${k}`} label="Summary" required hint="Shown on the Research page"><Textarea id={`te-${k}`} name="excerpt" defaultValue={p?.excerpt ?? ''} rows={3} className="min-h-[96px]" required /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`tf-${k}`} label={p?.pdf ? 'Replace PDF' : 'PDF (optional)'} hint="Up to 4 MB">
          <input id={`tf-${k}`} name="pdf" type="file" accept="application/pdf" className="block w-full text-base file:mr-4 file:min-h-[44px] file:rounded-full file:border-0 file:bg-teal-50 file:px-4 file:font-semibold file:text-teal-700" />
        </Field>
        <Field id={`td-${k}`} label="Date"><Input id={`td-${k}`} name="published_on" type="date" defaultValue={p?.published_at?.slice(0, 10)} /></Field>
      </div>
      <label className="flex min-h-[44px] items-center gap-3 text-base font-semibold text-ink">
        <input type="checkbox" name="publish" defaultChecked={p ? !!p.published_at : true} className="h-5 w-5 rounded border-line text-teal focus:ring-teal" /> Show on the website
      </label>
      <Save label={p ? 'Save changes' : 'Add to Research'} />
    </form>
  )
}

export function PostsList({ posts }: { posts: EditPost[] }) {
  return (
    <ul className="divide-y divide-line rounded-card border border-line bg-white shadow-card">
      {posts.length === 0 && <li className="p-5 text-base text-ink-muted">Nothing added yet. Until you add items, the website shows three sample briefs.</li>}
      {posts.map((p) => (
        <li key={p.id} className="p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-teal">{KIND_LABEL[p.kind]}</p><p className="font-semibold text-navy">{p.title}</p></div>
            <Badge tone={p.published_at ? 'success' : 'neutral'}>{p.published_at ? 'Published' : 'Draft'}</Badge>
            {p.pdf && <a href={p.pdf} target="_blank" rel="noreferrer" className="font-semibold text-teal hover:underline">PDF</a>}
            <Remove action={deletePost} id={p.id} what={`“${p.title}”`} />
          </div>
          <details className="mt-3 rounded-xl border border-line">
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center px-4 font-semibold text-teal [&::-webkit-details-marker]:hidden">Edit</summary>
            <div className="border-t border-line p-4"><PostForm p={p} /></div>
          </details>
        </li>
      ))}
    </ul>
  )
}

export function AddPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="rounded-card border border-dashed border-teal/50 bg-white">
      <summary className="flex min-h-[56px] cursor-pointer list-none items-center gap-2 px-5 font-semibold text-teal [&::-webkit-details-marker]:hidden"><Plus className="h-5 w-5" aria-hidden /> {title}</summary>
      <div className="border-t border-line p-5">{children}</div>
    </details>
  )
}
