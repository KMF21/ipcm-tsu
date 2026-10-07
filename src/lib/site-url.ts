import 'server-only'
import { headers } from 'next/headers'

/** The site's public address, e.g. https://ipcm.tsuniversity.edu.ng (no trailing slash). */
export async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const h = await headers()
  return `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`
}
