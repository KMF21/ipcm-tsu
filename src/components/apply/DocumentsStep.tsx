'use client'

import { useActionState, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { FileText, ImageIcon, Trash2, UploadCloud } from 'lucide-react'
import { finishDocuments, removeDocument, uploadDocument, type StepState } from '@/lib/application/actions'
import { DOC_RULES, formatBytes, type DocType } from '@/lib/application/steps'
import type { MyDocument } from '@/lib/application/queries'
import { Alert, Button, StatusPill } from '@/components/ui'
import { cn } from '@/lib/utils'
import { FormMessage, StepNav } from './fields'

/** Resize and compress a photo in the browser (passport: 600×600 JPEG under 300 KB). */
async function compressPhoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const sx = (bitmap.width - side) / 2
  const sy = Math.max(0, (bitmap.height - side) / 2 - side * 0.05) // keep a little more headroom
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 600
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 600, 600)
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, 600, 600)
  for (const q of [0.85, 0.75, 0.65, 0.55]) {
    const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), 'image/jpeg', q))
    if (blob.size <= 290 * 1024 || q === 0.55) return new File([blob], 'passport.jpg', { type: 'image/jpeg' })
  }
  return file
}

/** Shrinks large phone photos of documents (e.g. a 5 MB camera picture) so they upload on slow networks. */
async function compressDocumentImage(file: File): Promise<File> {
  if (file.size <= 900 * 1024) return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  for (const q of [0.82, 0.72, 0.62]) {
    const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), 'image/jpeg', q))
    if (blob.size <= 1.5 * 1024 * 1024 || q === 0.62) return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  }
  return file
}

function UploadButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="md" loading={pending} className="w-full sm:w-auto">
      {pending ? 'Uploading…' : 'Upload'}
    </Button>
  )
}

function DocUploader({ type, docs, required }: { type: DocType; docs: MyDocument[]; required: boolean }) {
  const rule = DOC_RULES[type]
  const [state, action] = useActionState<StepState, FormData>(uploadDocument, {})
  const [chosen, setChosen] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const full = docs.length >= rule.max
  const error = state.errors?.[type]
  const accept = rule.mimes.join(',')
  const kinds = rule.mimes.map((m) => (m === 'application/pdf' ? 'PDF' : m === 'image/png' ? 'PNG' : 'JPG')).join(', ')

  async function onPick(f: File | undefined) {
    if (!f) return
    let file = f
    if (f.type.startsWith('image/')) {
      setBusy(true)
      try {
        file = type === 'passport_photo' ? await compressPhoto(f) : await compressDocumentImage(f)
      } catch {
        // Older phones may not support resizing; send the original and let the size check speak.
      } finally {
        setBusy(false)
      }
    }
    // Put the (possibly compressed) file back into the input so the form submits it.
    const dt = new DataTransfer()
    dt.items.add(file)
    if (inputRef.current) inputRef.current.files = dt.files
    setChosen(file)
    setPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null)
  }

  return (
    <section className={cn('rounded-card border bg-white p-5', error ? 'border-crimson' : 'border-line')} aria-labelledby={`${type}-title`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id={`${type}-title`} className="text-lg font-semibold">
            {rule.label} {required ? <span className="text-crimson">*</span> : <span className="text-sm font-medium text-ink-muted">(optional)</span>}
          </h3>
          <p className="mt-1 text-sm text-ink-muted">{rule.help}</p>
          <p className="mt-1 text-sm text-ink-muted">{kinds} · up to {formatBytes(rule.maxBytes)}{rule.max > 1 ? ` · up to ${rule.max} files` : ''}</p>
        </div>
        {docs.length > 0 && <StatusPill status={docs.some((d) => d.status === 'rejected') ? 'rejected' : 'approved'} label={docs.some((d) => d.status === 'rejected') ? 'Needs replacing' : 'Uploaded'} />}
      </div>

      {docs.length > 0 && (
        <ul className="mt-4 space-y-2">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas p-3">
              <span className="flex min-w-0 items-center gap-3">
                {d.mime === 'application/pdf' ? <FileText className="h-6 w-6 shrink-0 text-teal" aria-hidden /> : <ImageIcon className="h-6 w-6 shrink-0 text-teal" aria-hidden />}
                <span className="min-w-0">
                  <span className="block truncate font-medium text-navy">{rule.label}{rule.max > 1 ? ` ${docs.indexOf(d) + 1}` : ''}</span>
                  <span className="text-sm text-ink-muted">{formatBytes(d.size_bytes)}{d.status === 'rejected' && d.rejection_reason ? ` · ${d.rejection_reason}` : ''}</span>
                </span>
              </span>
              {d.status !== 'approved' && (
                <form action={removeDocument}>
                  <input type="hidden" name="id" value={d.id} />
                  <button type="submit" className="flex h-11 w-11 items-center justify-center rounded-full text-crimson hover:bg-crimson-50" aria-label={`Remove ${rule.label}`}>
                    <Trash2 className="h-5 w-5" aria-hidden />
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      {!full && (
        <form action={action} className="mt-4" onSubmit={() => setTimeout(() => { setChosen(null); setPreview(null) }, 0)}>
          <input type="hidden" name="type" value={type} />
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-line bg-canvas px-4 py-6 text-center transition hover:border-teal has-[:focus-visible]:border-teal">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Preview of your photo" className="h-28 w-28 rounded-lg object-cover" />
            ) : (
              <UploadCloud className="h-8 w-8 text-teal" aria-hidden />
            )}
            <span className="text-base font-semibold text-navy">{busy ? 'Preparing photo…' : chosen ? chosen.name : 'Tap to choose a file'}</span>
            {chosen && <span className="text-sm text-ink-muted">{formatBytes(chosen.size)}</span>}
            <input ref={inputRef} type="file" name="file" accept={accept} className="sr-only" onChange={(e) => onPick(e.target.files?.[0])} />
          </label>
          {error && <p className="mt-2 text-sm font-medium text-crimson" role="alert">{error}</p>}
          {chosen && <div className="mt-3 flex justify-end"><UploadButton /></div>}
        </form>
      )}
    </section>
  )
}

export function DocumentsStep({ required, optional, documents, mode = 'wizard' }: { required: DocType[]; optional: DocType[]; documents: MyDocument[]; mode?: 'wizard' | 'fix' }) {
  const [state, action] = useActionState<StepState, FormData>(finishDocuments, {})
  const byType = (t: DocType) => documents.filter((d) => d.type === t)
  const missing = required.filter((t) => byType(t).length === 0)
  return (
    <div className="space-y-5">
      <Alert tone="info" title="Use clear scans or photos">On a phone, you can take a photo of a document. For PDFs, a free scanner app works well.</Alert>
      {required.map((t) => <DocUploader key={t} type={t} docs={byType(t)} required />)}
      {optional.map((t) => <DocUploader key={t} type={t} docs={byType(t)} required={false} />)}
      {mode === 'wizard' ? (
        <form action={action} noValidate>
          <FormMessage message={state.message} />
          {missing.length === 0 && <p className="mt-2 text-base font-medium text-success" role="status">All required documents are uploaded.</p>}
          <StepNav step={6} />
        </form>
      ) : (
        missing.length === 0 && <p className="text-base font-medium text-success" role="status">All required documents are uploaded. Your application goes back for review automatically.</p>
      )}
    </div>
  )
}
