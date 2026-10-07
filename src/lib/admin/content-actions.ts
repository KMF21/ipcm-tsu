'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import sharp from 'sharp'
import { z } from 'zod'
import { requireStaff } from './session'
import { can } from './roles'
import type { ActionState } from './actions'
import { sniffMime } from '@/lib/application/steps'

const GROUPS = ['director', 'staff', 'facilitator', 'board'] as const
const KINDS = ['policy_brief', 'publication', 'event_report', 'research_note', 'news'] as const

function refresh() {
  revalidatePath('/admin/website')
  revalidatePath('/people')
  revalidatePath('/research')
  revalidatePath('/')
}

/* ---------- People ---------- */
const personSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  name: z.string().trim().min(2, 'Enter a name').max(120),
  role: z.string().trim().min(2, 'Enter a role or title').max(120),
  group_name: z.enum(GROUPS),
  bio: z.string().trim().max(1200).optional(),
  expertise: z.string().trim().max(300).optional(),
  sort_order: z.coerce.number().int().min(0).max(999).default(0),
})

export async function savePerson(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireStaff(can.editContent)
  const parsed = personSchema.safeParse(Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === 'string')))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }
  const { id, expertise, ...v } = parsed.data
  const row: Record<string, unknown> = { ...v, bio: v.bio || null, expertise: (expertise ?? '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 6), is_placeholder: false }

  const photo = fd.get('photo')
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > 4 * 1024 * 1024) return { error: 'The photo is larger than 4 MB. Choose a smaller one.' }
    const bytes = new Uint8Array(await photo.arrayBuffer())
    const mime = sniffMime(bytes.subarray(0, 16))
    if (mime !== 'image/jpeg' && mime !== 'image/png') return { error: 'The photo must be a JPG or PNG.' }
    // Square, face-friendly crop at a sensible size for the website.
    const jpg = await sharp(bytes).rotate().resize(640, 640, { fit: 'cover', position: 'attention' }).jpeg({ quality: 84, mozjpeg: true }).toBuffer()
    const path = `people/${randomUUID()}.jpg`
    const up = await supabase.storage.from('public-media').upload(path, jpg, { contentType: 'image/jpeg' })
    if (up.error) return { error: 'The photo could not be uploaded. Please try again.' }
    row.photo_path = path
  }
  const { error } = id ? await supabase.from('people').update(row).eq('id', id) : await supabase.from('people').insert(row)
  if (error) {
    console.error('[admin] savePerson', error.message)
    return { error: 'We couldn’t save this person. Please try again.' }
  }
  refresh()
  return { ok: true, message: id ? 'Saved. The People page is updated.' : 'Added to the People page.' }
}

export async function deletePerson(fd: FormData) {
  const { supabase } = await requireStaff(can.editContent)
  const id = String(fd.get('id'))
  const { data } = await supabase.from('people').select('photo_path').eq('id', id).single()
  await supabase.from('people').delete().eq('id', id)
  if (data?.photo_path?.startsWith('people/')) await supabase.storage.from('public-media').remove([data.photo_path])
  refresh()
}

/* ---------- Research posts ---------- */
const postSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  kind: z.enum(KINDS),
  title: z.string().trim().min(5, 'Enter a title').max(200),
  excerpt: z.string().trim().min(10, 'Add a short summary').max(600),
  author: z.string().trim().max(160).optional(),
  published_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  publish: z.string().optional(),
})

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70)

export async function savePost(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireStaff(can.editContent)
  const parsed = postSchema.safeParse(Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === 'string')))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }
  const { id, publish, published_on, ...v } = parsed.data
  const row: Record<string, unknown> = {
    ...v,
    author: v.author || null,
    is_placeholder: false,
    published_at: publish === 'on' ? new Date(published_on ? `${published_on}T09:00:00+01:00` : Date.now()).toISOString() : null,
  }
  const pdf = fd.get('pdf')
  if (pdf instanceof File && pdf.size > 0) {
    if (pdf.size > 4 * 1024 * 1024) return { error: 'The PDF is larger than 4 MB. Compress it (for example with ilovepdf.com) and try again.' }
    const bytes = new Uint8Array(await pdf.arrayBuffer())
    if (sniffMime(bytes.subarray(0, 16)) !== 'application/pdf') return { error: 'The file must be a PDF.' }
    const path = `research/${slugify(v.title)}-${randomUUID().slice(0, 8)}.pdf`
    const up = await supabase.storage.from('public-media').upload(path, bytes, { contentType: 'application/pdf' })
    if (up.error) return { error: 'The PDF could not be uploaded. Please try again.' }
    row.pdf_path = path
  }
  if (!id) row.slug = `${slugify(v.title)}-${randomUUID().slice(0, 6)}`
  const { error } = id ? await supabase.from('posts').update(row).eq('id', id) : await supabase.from('posts').insert(row)
  if (error) {
    console.error('[admin] savePost', error.message)
    return { error: 'We couldn’t save this item. Please try again.' }
  }
  refresh()
  return { ok: true, message: row.published_at ? 'Saved and published on the Research page.' : 'Saved as a draft (not shown on the website).' }
}

export async function deletePost(fd: FormData) {
  const { supabase } = await requireStaff(can.editContent)
  const id = String(fd.get('id'))
  const { data } = await supabase.from('posts').select('pdf_path').eq('id', id).single()
  await supabase.from('posts').delete().eq('id', id)
  if (data?.pdf_path) await supabase.storage.from('public-media').remove([data.pdf_path])
  refresh()
}
