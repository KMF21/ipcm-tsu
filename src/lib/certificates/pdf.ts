import 'server-only'
import { PDFDocument, degrees, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib'
import { site } from '@/lib/site'
import { LINE, MUTED, NAVY, TEAL, asset, loadFonts, text, wrap, type Fonts } from '@/lib/pdf/kit'
import { qrPng } from '@/lib/receipts/qr'
import { longDate } from '@/lib/letters/types'
import { certificateVerifyPath, type Certificate, type PrintMode } from './types'

const W = 841.89
const H = 595.28

/**
 * Certificates, one per page (A4 landscape).
 * full: the complete certificate with security features (fine wave border, microtext, watermark).
 * qr:   a blank page with only the certificate number and QR code, placed bottom-right,
 *       to print onto the Institute's own pre-printed certificate paper.
 */
export async function buildCertificatesPdf(certs: Certificate[], mode: PrintMode, baseUrl: string) {
  const doc = await PDFDocument.create()
  doc.setTitle(certs.length === 1 ? `Certificate ${certs[0].certificate_no}` : `Certificates (${certs.length})`)
  doc.setAuthor(site.name)
  doc.setCreator(`${site.name}, ${site.parent}`)
  const f = await loadFonts(doc)
  const logo = mode === 'full' ? await doc.embedPng(await asset('src/assets/receipt-logo.png')) : null
  for (const c of certs) {
    const url = `${baseUrl}${certificateVerifyPath(c.verify_token)}`
    const qr = await doc.embedPng(await qrPng(url))
    const page = doc.addPage([W, H])
    if (mode === 'full') drawFull(page, f, logo!, qr, c, baseUrl)
    else drawQrOnly(page, f, qr, c, baseUrl)
  }
  return doc.save()
}

const centre = (page: PDFPage, f: Fonts, s: string, y: number, size: number, o: { font?: PDFFont; weight?: 400 | 600 | 700; display?: boolean; color?: typeof NAVY } = {}) => {
  const font = o.display ? f.display : f.latin[o.weight ?? 400]
  text(page, f, s, { x: W / 2 - font.widthOfTextAtSize(s, size) / 2, y, size, weight: o.weight, display: o.display, color: o.color })
}

/** Fine interference waves, hard to reproduce cleanly on a photocopier or scanner. */
function guilloche(page: PDFPage) {
  const band = (horizontal: boolean, at: number) => {
    const len = horizontal ? W : H
    for (let k = 0; k < 6; k++) {
      let d = ''
      for (let t = 26; t <= len - 26; t += 2.5) {
        const off = at + 7 * Math.sin(t / 11 + k * 1.05) * Math.cos(t / 47 + k * 0.4)
        const [x, y] = horizontal ? [t, off] : [off, t]
        d += `${d ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)} `
      }
      page.drawSvgPath(d, { x: 0, y: H, borderColor: k % 2 ? TEAL : NAVY, borderWidth: 0.35, borderOpacity: 0.55 })
    }
  }
  band(true, 33); band(true, H - 33); band(false, 33); band(false, W - 33)
}

/** A line of tiny repeated text that blurs into a solid line when copied. */
function microtext(page: PDFPage, f: Fonts, c: Certificate) {
  const unit = `${site.name.toUpperCase()} · ${site.parent.toUpperCase()} · ${c.certificate_no} · GENUINE CERTIFICATE · `
  const font = f.latin[600]
  const size = 2.8
  const line = (len: number) => {
    let s = ''
    while (font.widthOfTextAtSize(s + unit, size) < len) s += unit
    return s
  }
  const inset = 52
  page.drawText(line(W - inset * 2), { x: inset, y: H - inset + 1.5, size, font, color: TEAL })
  page.drawText(line(W - inset * 2), { x: inset, y: inset - 4, size, font, color: TEAL })
  page.drawText(line(H - inset * 2), { x: inset - 1.5, y: inset, size, font, color: TEAL, rotate: degrees(90) })
  page.drawText(line(H - inset * 2), { x: W - inset + 4, y: inset, size, font, color: TEAL, rotate: degrees(90) })
}

function drawFull(page: PDFPage, f: Fonts, logo: PDFImage, qr: PDFImage, c: Certificate, baseUrl: string) {
  // Frame
  page.drawRectangle({ x: 18, y: 18, width: W - 36, height: H - 36, borderColor: NAVY, borderWidth: 2.5 })
  guilloche(page)
  page.drawRectangle({ x: 48, y: 48, width: W - 96, height: H - 96, borderColor: TEAL, borderWidth: 0.9 })
  page.drawRectangle({ x: 56, y: 56, width: W - 112, height: H - 112, borderColor: NAVY, borderWidth: 0.4 })
  microtext(page, f, c)
  for (const [x, y] of [[56, 56], [W - 56, 56], [56, H - 56], [W - 56, H - 56]]) {
    page.drawSvgPath('M0,-6 L6,0 L0,6 L-6,0 Z', { x, y, color: NAVY })
  }
  // Watermark
  page.drawImage(logo, { x: W / 2 - 150, y: H / 2 - 165, width: 300, height: 300, opacity: 0.05 })

  // Heading
  let y = H - 78
  page.drawImage(logo, { x: W / 2 - 27, y: y - 54, width: 54, height: 54 })
  y -= 74
  centre(page, f, `${site.parent.toUpperCase()}, JALINGO`, y, 10, { weight: 700, color: TEAL })
  y -= 26
  centre(page, f, site.name, y, 21, { display: true, color: NAVY })

  y -= 44
  centre(page, f, 'This is to certify that', y, 12, { color: MUTED })

  // Holder's name, shrunk to fit
  let size = 32
  while (f.display.widthOfTextAtSize(c.holder_name, size) > W - 220 && size > 18) size -= 1
  y -= size + 12
  centre(page, f, c.holder_name, y, size, { display: true, color: NAVY })
  y -= 12
  page.drawLine({ start: { x: W / 2 - 180, y }, end: { x: W / 2 + 180, y }, thickness: 0.6, color: LINE })

  y -= 24
  centre(page, f, 'having satisfactorily completed the prescribed course of study and assessment, is awarded the', y, 11.5, { color: MUTED })
  y -= 30
  const lines = wrap(f.display, c.programme_title, 19, W - 240)
  for (const ln of lines) { centre(page, f, ln, y, 19, { display: true, color: TEAL }); y -= 24 }
  if (c.classification === 'Distinction') {
    y -= 2
    centre(page, f, 'with Distinction', y, 13, { weight: 700, color: NAVY })
    y -= 20
  } else y -= 4
  centre(page, f, `${c.cohort_name}  ·  Awarded ${longDate(c.issued_at)}`, y, 10, { color: MUTED })

  // Signatures and verification
  const sigY = 112
  const sig = (cx: number, name: string, title: string) => {
    page.drawLine({ start: { x: cx - 105, y: sigY }, end: { x: cx + 105, y: sigY }, thickness: 0.7, color: NAVY })
    if (name) text(page, f, name, { x: cx - f.latin[700].widthOfTextAtSize(name, 10.5) / 2, y: sigY - 15, size: 10.5, weight: 700, color: NAVY })
    text(page, f, title, { x: cx - f.latin[400].widthOfTextAtSize(title, 8.5) / 2, y: sigY - (name ? 28 : 15), size: 8.5, color: MUTED })
  }
  sig(200, site.director.name, 'Director, Institute of Peace and Conflict Management')
  sig(W - 200, '', `Vice-Chancellor, ${site.parent}`)

  const qs = 58
  page.drawImage(qr, { x: W / 2 - qs / 2, y: 92, width: qs, height: qs })
  centre(page, f, `No. ${c.certificate_no}`, 80, 9, { weight: 700, color: NAVY })
  centre(page, f, `Scan or visit ${baseUrl.replace(/^https?:\/\//, '')}/verify`, 69, 7.5, { color: MUTED })
}

function drawQrOnly(page: PDFPage, f: Fonts, qr: PDFImage, c: Certificate, baseUrl: string) {
  const qs = 66
  const right = W - 60
  const x = right - qs
  const y = 78
  page.drawImage(qr, { x, y, width: qs, height: qs })
  text(page, f, `No. ${c.certificate_no}`, { x: right, y: y - 13, size: 9.5, weight: 700, color: NAVY, align: 'right' })
  text(page, f, `Verify: ${baseUrl.replace(/^https?:\/\//, '')}/verify`, { x: right, y: y - 25, size: 7.5, color: MUTED, align: 'right' })
}
