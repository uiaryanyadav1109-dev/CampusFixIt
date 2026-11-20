import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ---- Performance ----
  cacheComponents: true,
  partialPrefetching: true,

  // ---- Security headers (T-034 will add full CSP) ----
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ]
  },

  // ---- Images ----
  images: {
    // Storage host added here when STORAGE_ENDPOINT is known
    remotePatterns: [],
  },

  // ---- Tailwind CSS via turbopack ----
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
