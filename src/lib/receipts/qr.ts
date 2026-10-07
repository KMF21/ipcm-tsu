import 'server-only'
import QRCode from 'qrcode'

// Medium error correction survives a crease or a smudge on a printed receipt.
const opts = { errorCorrectionLevel: 'M' as const, margin: 0, color: { dark: '#0F1F3DFF', light: '#FFFFFFFF' } }

export async function qrSvg(text: string) {
  return QRCode.toString(text, { ...opts, margin: 2, type: 'svg' })
}

export async function qrPng(text: string, width = 480) {
  return QRCode.toBuffer(text, { ...opts, type: 'png', width })
}
