import 'server-only'
import { PDFDocument, rgb } from 'pdf-lib'
import { site } from '@/lib/site'
import { CANVAS, INK, LINE, MUTED, NAVY, SUCCESS, TEAL, TEAL_50, asset, loadFonts, text, wrap } from '@/lib/pdf/kit'
import { qrPng } from './qr'
import { FEE_LABEL, formatDateTime, formatNairaExact, paymentMethodLabel, type Receipt } from './types'

export async function buildReceiptPdf(r: Receipt, verifyUrl: string) {
  const doc = await PDFDocument.create()
  doc.setTitle(`Receipt ${r.receipt_no}`)
  doc.setAuthor(site.name)
  doc.setSubject(`${FEE_LABEL[r.fee_type]} receipt`)
  doc.setCreator(`${site.name}, ${site.parent}`)

  const f = await loadFonts(doc)
  const { 400: l4, 600: l6, 700: l7 } = f.latin
  const logo = await doc.embedPng(await asset('src/assets/receipt-logo.png'))
  const qr = await doc.embedPng(await qrPng(verifyUrl))

  const page = doc.addPage([595.28, 841.89]) // A4
  const W = page.getWidth()
  const M = 48
  const right = W - M
  let y = page.getHeight()

  // Brand band
  page.drawRectangle({ x: 0, y: y - 8, width: W, height: 8, color: NAVY })
  page.drawRectangle({ x: 0, y: y - 11, width: W, height: 3, color: TEAL })
  y -= 40

  // Header: logo + institute, receipt title on the right
  page.drawImage(logo, { x: M, y: y - 52, width: 52, height: 52 })
  text(page, f, 'Institute of Peace and', { x: M + 64, y: y - 18, size: 13, display: true, color: NAVY })
  text(page, f, 'Conflict Management', { x: M + 64, y: y - 34, size: 13, display: true, color: NAVY })
  text(page, f, `${site.parent}, Jalingo`, { x: M + 64, y: y - 49, size: 9.5, color: MUTED })
  text(page, f, 'PAYMENT RECEIPT', { x: right, y: y - 16, size: 9.5, weight: 700, color: TEAL, align: 'right' })
  text(page, f, r.receipt_no, { x: right, y: y - 36, size: 16, display: true, color: NAVY, align: 'right' })
  text(page, f, formatDateTime(r.paid_at), { x: right, y: y - 52, size: 9.5, color: MUTED, align: 'right' })
  y -= 78

  // Amount panel
  page.drawRectangle({ x: M, y: y - 74, width: right - M, height: 74, color: TEAL_50 })
  text(page, f, 'Amount paid', { x: M + 20, y: y - 26, size: 10, weight: 600, color: MUTED })
  text(page, f, formatNairaExact(r.amount_kobo), { x: M + 20, y: y - 56, size: 26, display: true, color: NAVY })
  const pill = 'PAID'
  const pw = l7.widthOfTextAtSize(pill, 10) + 28
  page.drawRectangle({ x: right - 20 - pw, y: y - 46, width: pw, height: 22, color: SUCCESS })
  text(page, f, pill, { x: right - 20 - pw / 2 - l7.widthOfTextAtSize(pill, 10) / 2, y: y - 39, size: 10, weight: 700, color: rgb(1, 1, 1) })
  y -= 104

  // Two columns of details
  const colW = (right - M - 24) / 2
  const col2 = M + colW + 24
  const rows = (x: number, startY: number, title: string, items: [string, string | null | undefined][]) => {
    let yy = startY
    text(page, f, title.toUpperCase(), { x, y: yy, size: 9, weight: 700, color: TEAL })
    yy -= 10
    page.drawLine({ start: { x, y: yy }, end: { x: x + colW, y: yy }, thickness: 0.75, color: LINE })
    yy -= 18
    for (const [k, v] of items) {
      if (!v) continue
      text(page, f, k, { x, y: yy, size: 9, color: MUTED })
      yy -= 14
      for (const ln of wrap(l6, v, 10.5, colW)) {
        text(page, f, ln, { x, y: yy, size: 10.5, weight: 600, color: INK })
        yy -= 14
      }
      yy -= 8
    }
    return yy
  }
  const yA = rows(M, y, 'Received from', [
    ['Name', r.payer_name || r.payer_email],
    ['Email', r.payer_email],
    ['Phone', r.payer_phone],
    ['Application number', r.application_ref],
    ['Registration number', r.reg_no],
  ])
  const yB = rows(col2, y, 'Payment details', [
    ['Receipt number', r.receipt_no],
    ['Date and time', formatDateTime(r.paid_at)],
    ['Payment method', paymentMethodLabel(r.method, r.channel)],
    ['Transaction reference', r.reference],
  ])
  y = Math.min(yA, yB) - 10

  // Items table
  page.drawRectangle({ x: M, y: y - 26, width: right - M, height: 26, color: CANVAS })
  text(page, f, 'Description', { x: M + 14, y: y - 17, size: 9.5, weight: 700, color: NAVY })
  text(page, f, 'Amount', { x: right - 14, y: y - 17, size: 9.5, weight: 700, color: NAVY, align: 'right' })
  y -= 26
  const item = (title: string, sub: string | null, kobo: number) => {
    const lines = wrap(l6, title, 10.5, right - M - 160)
    let yy = y - 20
    lines.forEach((ln, i) => text(page, f, ln, { x: M + 14, y: yy - i * 14, size: 10.5, weight: 600 }))
    yy -= (lines.length - 1) * 14
    if (sub) {
      yy -= 14
      text(page, f, sub, { x: M + 14, y: yy, size: 9, color: MUTED })
    }
    text(page, f, formatNairaExact(kobo), { x: right - 14, y: y - 20, size: 10.5, weight: 600, align: 'right' })
    y = yy - 14
    page.drawLine({ start: { x: M, y }, end: { x: right, y }, thickness: 0.75, color: LINE })
  }
  item(
    `${FEE_LABEL[r.fee_type]}: ${r.programme_code}, ${r.programme_title}`,
    [r.cohort_name, 'Certificate programme'].filter(Boolean).join(' · '),
    r.base_amount_kobo,
  )
  item('Processing charge', null, r.processing_fee_kobo)
  text(page, f, 'Total paid', { x: M + 14, y: y - 24, size: 11.5, weight: 700, color: NAVY })
  text(page, f, formatNairaExact(r.amount_kobo), { x: right - 14, y: y - 24, size: 13, display: true, color: NAVY, align: 'right' })
  y -= 40
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, thickness: 1.5, color: NAVY })

  // Verification block, anchored above the footer
  const vy = 132
  const qs = 92
  page.drawRectangle({ x: M, y: vy, width: right - M, height: qs + 28, borderColor: LINE, borderWidth: 0.75 })
  page.drawImage(qr, { x: M + 14, y: vy + 14, width: qs, height: qs })
  const tx = M + 14 + qs + 20
  text(page, f, 'Check that this receipt is genuine', { x: tx, y: vy + qs - 2, size: 11.5, weight: 700, color: NAVY })
  const note = 'Scan the QR code with a phone camera. It opens the Institute’s website and shows the details on record for this receipt. If they don’t match what is printed here, the receipt is not valid.'
  wrap(l4, note, 9.5, right - tx - 14).forEach((ln, i) => text(page, f, ln, { x: tx, y: vy + qs - 22 - i * 13, size: 9.5, color: MUTED }))
  const shortUrl = verifyUrl.replace(/^https?:\/\//, '')
  wrap(l6, shortUrl, 8.5, right - tx - 14).forEach((ln, i, arr) => text(page, f, ln, { x: tx, y: vy + 14 + (arr.length - 1 - i) * 11, size: 8.5, weight: 600, color: TEAL }))

  // Footer
  page.drawLine({ start: { x: M, y: 92 }, end: { x: right, y: 92 }, thickness: 0.75, color: LINE })
  text(page, f, 'This receipt was issued electronically and is valid without a signature or stamp.', { x: M, y: 74, size: 9, color: MUTED })
  wrap(l4, site.address.value, 9, right - M).forEach((ln, i) => text(page, f, ln, { x: M, y: 59 - i * 12, size: 9, color: MUTED }))
  text(page, f, `${site.email.value}  ·  ${site.phone.value}`, { x: M, y: 59 - wrap(l4, site.address.value, 9, right - M).length * 12, size: 9, color: MUTED })

  return doc.save()
}
