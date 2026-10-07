/** Address used in email links and QR codes. Prefers the configured domain over the request's host. */
export function emailBaseUrl(fallbackOrigin: string) {
  return (process.env.NEXT_PUBLIC_SITE_URL || fallbackOrigin).replace(/\/$/, '')
}
