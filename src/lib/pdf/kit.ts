import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { rgb, type PDFDocument, type PDFFont, type PDFPage, type RGB } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

export const hex = (h: string): RGB => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255)
export const NAVY = hex('#0F1F3D')
export const TEAL = hex('#0E7C6B')
export const TEAL_50 = hex('#E8F5F2')
export const INK = hex('#1C2536')
export const MUTED = hex('#4A5468')
export const LINE = hex('#E3E7EE')
export const CANVAS = hex('#F6F8FB')
export const SUCCESS = hex('#2F855A')

const root = process.cwd()
export const asset = (p: string) => readFile(path.join(root, p))

export type Weight = 400 | 600 | 700
export type Fonts = { latin: Record<Weight, PDFFont>; ext: Record<Weight, PDFFont>; display: PDFFont }

/**
 * Draws text, switching to the extended font for the Naira sign (₦), which the base
 * Latin subset doesn't include. Returns the width drawn.
 */
export function text(page: PDFPage, f: Fonts, s: string, o: { x: number; y: number; size: number; weight?: Weight; color?: RGB; display?: boolean; align?: 'left' | 'right' }) {
  const w = o.weight ?? 400
  const parts = s.split(/(₦)/).filter(Boolean).map((t) => ({ t, font: o.display ? (t === '₦' ? f.ext[700] : f.display) : t === '₦' ? f.ext[w] : f.latin[w] }))
  const width = parts.reduce((n, p) => n + p.font.widthOfTextAtSize(p.t, o.size), 0)
  let x = o.align === 'right' ? o.x - width : o.x
  for (const p of parts) {
    page.drawText(p.t, { x, y: o.y, size: o.size, font: p.font, color: o.color ?? INK })
    x += p.font.widthOfTextAtSize(p.t, o.size)
  }
  return width
}

export function wrap(font: PDFFont, s: string, size: number, maxWidth: number) {
  const lines: string[] = []
  let line = ''
  // Long unbroken strings (references, links) are split by character.
  const words = s.split(/\s+/).flatMap((w) => {
    if (font.widthOfTextAtSize(w, size) <= maxWidth) return [w]
    const out: string[] = []
    let chunk = ''
    for (const ch of w) {
      if (font.widthOfTextAtSize(chunk + ch, size) > maxWidth) { out.push(chunk); chunk = ch } else chunk += ch
    }
    return chunk ? [...out, chunk] : out
  })
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}


/** Registers fontkit and embeds Inter (body), Inter Latin-Ext (for ₦) and Sora (headings). */
export async function loadFonts(doc: PDFDocument): Promise<Fonts> {
  doc.registerFontkit(fontkit)
  const font = (name: string) => asset(`src/assets/fonts/${name}.woff`).then((b) => doc.embedFont(b, { subset: true }))
  const [l4, l6, l7, e4, e6, e7, display] = await Promise.all([
    font('inter-latin-400-normal'), font('inter-latin-600-normal'), font('inter-latin-700-normal'),
    font('inter-latin-ext-400-normal'), font('inter-latin-ext-600-normal'), font('inter-latin-ext-700-normal'),
    font('sora-latin-700-normal'),
  ])
  return { latin: { 400: l4, 600: l6, 700: l7 }, ext: { 400: e4, 600: e6, 700: e7 }, display }
}
