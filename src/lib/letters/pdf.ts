import 'server-only'
import { PDFDocument, rgb } from 'pdf-lib'
import { site } from '@/lib/site'
import { FORMAT } from '@/lib/programmes'
import { CANVAS, INK, LINE, MUTED, NAVY, TEAL, asset, loadFonts, text, wrap } from '@/lib/pdf/kit'
import { qrPng } from '@/lib/receipts/qr'
import { longDate, weekdayDate, type AdmissionLetter } from './types'

export async function buildAdmissionLetterPdf(l: AdmissionLetter, verifyUrl: string) {
  const doc = await PDFDocument.create()
  doc.setTitle(`Admission letter ${l.reg_no}`)
  doc.setAuthor(site.name)
  doc.setSubject(`Letter of admission: ${l.programme_title}`)
  doc.setCreator(`${site.name}, ${site.parent}`)
  const f = await loadFonts(doc)
  const { 400: r, 600: sb } = f.latin
  const logo = await doc.embedPng(await asset('src/assets/receipt-logo.png'))
  const qr = await doc.embedPng(await qrPng(verifyUrl))

  const page = doc.addPage([595.28, 841.89])
  const W = page.getWidth()
  const M = 56
  const right = W - M
  const width = right - M
  let y = page.getHeight()

  page.drawRectangle({ x: 0, y: y - 8, width: W, height: 8, color: NAVY })
  page.drawRectangle({ x: 0, y: y - 11, width: W, height: 3, color: TEAL })

  // Letterhead, centred
  y -= 30
  page.drawImage(logo, { x: W / 2 - 24, y: y - 48, width: 48, height: 48 })
  y -= 62
  const centre = (s: string, size: number, opts: { weight?: 400 | 600 | 700; display?: boolean; color?: typeof INK } = {}) => {
    const font = opts.display ? f.display : f.latin[opts.weight ?? 400]
    text(page, f, s, { x: W / 2 - font.widthOfTextAtSize(s, size) / 2, y, size, weight: opts.weight, display: opts.display, color: opts.color })
  }
  centre(site.parent.toUpperCase() + ', JALINGO', 8.5, { weight: 700, color: TEAL })
  y -= 18
  centre(site.name, 15, { display: true, color: NAVY })
  y -= 14
  centre(`${site.address.value.replace(/^Institute of Peace and Conflict Management, /, '')}`, 8.5, { color: MUTED })
  y -= 12
  centre(`${site.email.value}  ·  ${site.phone.value}`, 8.5, { color: MUTED })
  y -= 14
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, thickness: 0.75, color: LINE })

  // Reference and date
  y -= 22
  text(page, f, `Our ref: ${l.reg_no}`, { x: M, y, size: 9.5, weight: 600, color: INK })
  text(page, f, longDate(l.admitted_at), { x: right, y, size: 9.5, color: INK, align: 'right' })

  // Addressee
  y -= 24
  text(page, f, l.name, { x: M, y, size: 10.5, weight: 700 })
  if (l.address) {
    for (const ln of wrap(r, l.address, 9.5, 260)) { y -= 13; text(page, f, ln, { x: M, y, size: 9.5, color: MUTED }) }
  }
  y -= 13
  text(page, f, l.email, { x: M, y, size: 9.5, color: MUTED })

  // Title
  y -= 28
  text(page, f, 'LETTER OF ADMISSION', { x: M, y, size: 9.5, weight: 700, color: TEAL })
  y -= 18
  for (const ln of wrap(f.display, l.programme_title, 14, width)) { text(page, f, ln, { x: M, y, size: 14, display: true, color: NAVY }); y -= 18 }

  const para = (s: string, gap = 8, size = 10) => {
    for (const ln of wrap(r, s, size, width)) { text(page, f, ln, { x: M, y, size, color: INK }); y -= size + 4.5 }
    y -= gap
  }
  y -= 6
  para(`Dear ${l.first_name || l.name},`, 4)
  para(`I am pleased to confirm your admission to the ${l.programme_title} at the ${site.name}, ${site.parent}, for the ${l.cohort_name}. Your tuition has been received and your place is secured.`)

  // Details panel
  const rows: [string, string][] = [
    ['Registration number', l.reg_no],
    ['Programme', `${l.programme_code}, ${l.programme_title}`],
    ['Intake', l.cohort_name],
    ['First class', weekdayDate(l.start_date)],
    ['Last class', weekdayDate(l.end_date)],
    ['Schedule', `${FORMAT.schedule} for ${FORMAT.durationWeeks} weeks (${FORMAT.contactHours} contact hours)`],
    ['Venue', l.venue || site.venue.value],
  ]
  const labelW = 128
  const valueW = width - 28 - labelW
  const lines = rows.map(([, v]) => wrap(sb, v, 9.5, valueW))
  const panelH = 16 + lines.reduce((n, ls) => n + ls.length * 13 + 5, 0)
  page.drawRectangle({ x: M, y: y - panelH + 6, width, height: panelH, color: CANVAS })
  let py = y - 8
  rows.forEach(([k], i) => {
    text(page, f, k, { x: M + 14, y: py, size: 9, color: MUTED })
    lines[i].forEach((ln, j) => text(page, f, ln, { x: M + 14 + labelW, y: py - j * 13, size: 9.5, weight: k === 'Registration number' ? 700 : 600, color: k === 'Registration number' ? NAVY : INK }))
    py -= lines[i].length * 13 + 5
  })
  y -= panelH + 8

  text(page, f, 'On your first day, please bring', { x: M, y, size: 10, weight: 700, color: NAVY })
  y -= 15
  for (const item of ['This letter, printed or on your phone', 'A valid means of identification', 'Your payment receipts (also in your portal)']) {
    page.drawCircle({ x: M + 4, y: y + 3.2, size: 1.8, color: TEAL })
    text(page, f, item, { x: M + 14, y, size: 10 })
    y -= 14.5
  }
  y -= 6
  para(`The certificate is awarded with ${FORMAT.award.charAt(0).toLowerCase()}${FORMAT.award.slice(1)} Your class details and announcements will appear in your student portal before the first class. Please quote your registration number in all correspondence.`)
  para('We look forward to welcoming you to the Institute.', 10)

  // Signature (left) and verification (right), side by side
  const top = Math.min(y, 150)
  text(page, f, 'Yours sincerely,', { x: M, y: top, size: 10 })
  text(page, f, site.director.name, { x: M, y: top - 40, size: 11, weight: 700, color: NAVY })
  text(page, f, site.director.title, { x: M, y: top - 54, size: 9, color: MUTED })

  const qs = 70
  const qx = right - qs
  const qy = top - qs + 10
  page.drawImage(qr, { x: qx, y: qy, width: qs, height: qs })
  const tw = 150
  text(page, f, 'Check this letter is genuine', { x: qx - 12, y: top, size: 9, weight: 700, color: NAVY, align: 'right' })
  wrap(r, 'Scan the QR code with a phone camera to see the admission on record. Issued electronically; valid without a stamp.', 8, tw).forEach((ln, i) => {
    text(page, f, ln, { x: qx - 12, y: top - 13 - i * 10.5, size: 8, color: MUTED, align: 'right' })
  })

  // Footer
  page.drawLine({ start: { x: M, y: 50 }, end: { x: right, y: 50 }, thickness: 0.75, color: LINE })
  const link = `Verify at ${verifyUrl.replace(/^https?:\/\//, '')}`
  text(page, f, link, { x: W / 2 - sb.widthOfTextAtSize(link, 7.5) / 2, y: 36, size: 7.5, weight: 600, color: TEAL })
  const foot = `${site.name} · ${site.parent}`
  text(page, f, foot, { x: W / 2 - r.widthOfTextAtSize(foot, 8) / 2, y: 24, size: 8, color: MUTED })
  page.drawRectangle({ x: 0, y: 0, width: W, height: 4, color: rgb(14 / 255, 124 / 255, 107 / 255) })

  return doc.save()
}
