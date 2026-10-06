import type { MetadataRoute } from 'next'
import { programmes } from '@/lib/programmes'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const pages = ['', '/about', '/programmes', '/admissions', '/people', '/research', '/contact', '/faq', '/verify']
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.7 })),
    ...programmes.map((p) => ({ url: `${base}/programmes/${p.slug}`, changeFrequency: 'monthly' as const, priority: 0.9 })),
  ]
}
