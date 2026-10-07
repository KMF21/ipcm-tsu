import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // Document uploads go through Server Actions (largest allowed file is 2 MB).
    serverActions: { bodySizeLimit: '3mb' },
  },
  // Receipt PDFs read these files at runtime; make sure they ship with the serverless function.
  outputFileTracingIncludes: {
    '/portal/payments/[id]/pdf': ['./src/assets/**/*'],
    '/admin/payments/[id]/pdf': ['./src/assets/**/*'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
