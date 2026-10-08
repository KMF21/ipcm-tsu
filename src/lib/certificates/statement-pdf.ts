import 'server-only'
import { PDFDocument } from 'pdf-lib'
import { site } from '@/lib/site'
import { CANVAS, INK, LINE, MUTED, NAVY, TEAL, asset, loadFonts, text, wrap } from '@/lib/pdf/kit'
import { qrPng } from '@/lib/receipts/qr'
import { longDate } from '@/lib/letters/types'
import { certificateVerifyPath, type Statement } from './types'

const pct = (n: number | null | undefined) => (n === null || n === undefined ? '—' : `${Number(n).toFixed(Number.isInteger(Number(n)) ? 0 : 1)}%`)
const score = (n: number | null | undefined) => (n === null || n === undefined ? '—' : `${Number(n)}`)

/** One-page statement of result (A4 portrait). */
export async function buildStatementPdf(s: Statement, baseUrl: string) {
  const doc = await PDFDocument.create()
  doc.setTitle(`Statement of result ${s.reg_no}`)
  doc.setAuthor(site.name)
  doc.setCreator(`${site.name}, ${site.parent}`)
  const f = await loadFonts(doc)
  const { 400: r, 600: sb } = f.latin
  const logo = await doc.embedPng(await asset('src/assets/receipt-logo.png'))
  const qr = s.certificate_token ? await doc.embedPng(await qrPng(`${baseUrl}${certificateVerifyPath(s.certificate_token)}`)) : null

  const page = doc.addPage([595.28, 841.89])
  const W = page.getWidth()
  const M = 56
  const right = W - M
  const width = right - M
  let y = page.getHeight()

  page.drawRectangle({ x: 0, y: y - 8, width: W, height: 8, color: NAVY })
  page.drawRectangle({ x: 0, y: y - 11, width: W, height: 3, color: TEAL })
  const centre = (str: string, size: number, o: { weight?: 400 | 600 | 700; display?: boolean; color?: typeof INK } = {}) => {
    const font = o.display ? f.display : f.latin[o.weight ?? 400]
    text(page, f, str, { x: W / 2 - font.widthOfTextAtSize(str, size) / 2, y, size, weight: o.weight, display: o.display, color: o.color })
  }
  y -= 30
  page.drawImage(logo, { x: W / 2 - 24, y: y - 48, width: 48, height: 48 })
  y -= 62
  centre(site.parent.toUpperCase() + ', JALINGO', 8.5, { weight: 700, color: TEAL })
  y -= 18
  centre(site.name, 15, { display: true, color: NAVY })
  y -= 16
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, thickness: 0.75, color: LINE })

  y -= 30
  centre('STATEMENT OF RESULT', 13, { weight: 700, color: NAVY })
  y -= 26

  // Student details
  const rows: [string, string][] = [
    ['Name', s.name],
    ['Registration number', s.reg_no],
    ['Programme', `${s.programme_code}, ${s.programme_title}`],
    ['Intake', `${s.cohort_name} (${longDate(s.start_date)} to ${longDate(s.end_date)})`],
  ]
  const labelW = 128
  const valueW = width - 28 - labelW
  const lines = rows.map(([, v]) => wrap(sb, v, 9.5, valueW))
  const panelH = 16 + lines.reduce((n, ls) => n + ls.length * 13 + 5, 0)
  page.drawRectangle({ x: M, y: y - panelH + 6, width, height: panelH, color: CANVAS })
  let py = y - 8
  rows.forEach(([k], i) => {
    text(page, f, k, { x: M + 14, y: py, size: 9, color: MUTED })
    lines[i].forEach((ln, j) => text(page, f, ln, { x: M + 14 + labelW, y: py - j * 13, size: 9.5, weight: 600 }))
    py -= lines[i].length * 13 + 5
  })
  y -= panelH + 16

  // Scores table
  const colScore = right - 10
  const head = () => {
    page.drawRectangle({ x: M, y: y - 6, width, height: 22, color: NAVY })
    text(page, f, 'Assessment', { x: M + 12, y: y + 1, size: 9, weight: 700, color: CANVAS })
    text(page, f, 'Score', { x: colScore, y: y + 1, size: 9, weight: 700, color: CANVAS, align: 'right' })
    y -= 24
  }
  const row = (label: string, value: string, o: { bold?: boolean; note?: string } = {}) => {
    const ls = wrap(o.bold ? f.latin[700] : r, label, 9.5, width - 110)
    ls.forEach((ln, i) => text(page, f, ln, { x: M + 12, y: y - i * 12.5, size: 9.5, weight: o.bold ? 700 : 400 }))
    text(page, f, value, { x: colScore, y, size: 9.5, weight: o.bold ? 700 : 600, color: o.bold ? NAVY : INK, align: 'right' })
    y -= ls.length * 12.5
    if (o.note) { text(page, f, o.note, { x: M + 12, y: y + 1, size: 8, color: MUTED }); y -= 11 }
    y -= 5
    page.drawLine({ start: { x: M, y: y + 2 }, end: { x: right, y: y + 2 }, thickness: 0.5, color: LINE })
    y -= 8
  }
  head()
  for (const m of s.modules) row(`Module ${m.number}: ${m.title}`, score(m.score))
  row('Capstone project', score(s.capstone))
  if (s.attendance_mode !== 'off') {
    row('Attendance', s.attendance_waived && s.attendance_mode === 'required' ? 'Waived' : pct(s.attendance_pct), { note: s.attendance_mode === 'info' ? 'Recorded for information; not part of the overall score.' : undefined })
  }
  row('Overall score', pct(s.total_pct), { bold: true })
  row('Result', s.classification ?? 'Pending', { bold: true })
  y -= 4
  const rule = s.attendance_mode === 'required'
    ? 'Overall score: attendance 20%, module exercises 30%, capstone 50%. Pass at 50%, Distinction at 70%.'
    : 'Overall score: module exercises 37.5%, capstone 62.5%. Pass at 50%, Distinction at 70%.'
  for (const ln of wrap(r, `Scores are out of 100. ${rule}`, 8.5, width)) { text(page, f, ln, { x: M, y, size: 8.5, color: MUTED }); y -= 11.5 }

  // Signature and certificate
  const top = Math.min(y - 24, 170)
  text(page, f, site.director.name, { x: M, y: top - 34, size: 11, weight: 700, color: NAVY })
  text(page, f, site.director.title, { x: M, y: top - 48, size: 9, color: MUTED })
  if (s.published_at) text(page, f, `Results published ${longDate(s.published_at)}`, { x: M, y: top - 62, size: 9, color: MUTED })
  if (qr && s.certificate_no) {
    const qs = 70
    const qx = right - qs
    page.drawImage(qr, { x: qx, y: top - qs + 10, width: qs, height: qs })
    text(page, f, 'Certificate', { x: qx - 12, y: top, size: 9, weight: 700, color: NAVY, align: 'right' })
    text(page, f, s.certificate_no, { x: qx - 12, y: top - 13, size: 9, weight: 600, align: 'right' })
    wrap(r, 'Scan to check the certificate on the Institute’s website.', 8, 140).forEach((ln, i) => text(page, f, ln, { x: qx - 12, y: top - 27 - i * 10.5, size: 8, color: MUTED, align: 'right' }))
  } else {
    text(page, f, 'Certificate not yet issued', { x: right, y: top, size: 9, weight: 600, color: MUTED, align: 'right' })
  }

  page.drawLine({ start: { x: M, y: 50 }, end: { x: right, y: 50 }, thickness: 0.75, color: LINE })
  const note = 'This statement is issued for information. The certificate is the award document.'
  text(page, f, note, { x: W / 2 - r.widthOfTextAtSize(note, 8) / 2, y: 36, size: 8, color: MUTED })
  const foot = `${site.name} · ${site.parent}`
  text(page, f, foot, { x: W / 2 - r.widthOfTextAtSize(foot, 8) / 2, y: 24, size: 8, color: MUTED })
  page.drawRectangle({ x: 0, y: 0, width: W, height: 4, color: TEAL })
  return doc.save()
}
