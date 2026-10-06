import type { Metadata, Viewport } from 'next'
import './globals.css'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: `${site.name} | ${site.parent}`, template: `%s | IPCM, ${site.parent}` },
  description:
    'Professional certificate programmes in peace, mediation, early warning, peacebuilding and security from the Institute of Peace and Conflict Management, Taraba State University, Jalingo.',
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    siteName: `${site.name}, ${site.parent}`,
    images: ['/placeholders/og-default.jpg'],
  },
  icons: { icon: '/tsu-logo.png' },
}

export const viewport: Viewport = { themeColor: '#0F1F3D', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-teal focus:px-4 focus:py-2 focus:text-white">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
