/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  distDir: process.env.DIST_DIR || '.next',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optimize package imports for better tree-shaking
  experimental: {
    optimizePackageImports: ['@heroicons/react', '@supabase/supabase-js'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async headers() {
    // Skip CSP headers in development for VS Code Simple Browser compatibility
    const isDev = process.env.NODE_ENV === 'development';

    // Content Security Policy - standard (restricts framing)
    // NOTE: In dev mode, we omit frame-ancestors entirely to allow VS Code Simple Browser
    // (Electron bug: frame-ancestors * doesn't work with vscode-webview:// scheme)
    const cspHeader = isDev
      ? "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:"
      : [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https://images.unsplash.com https://images.pexels.com https://images.pixabay.com https://*.supabase.co",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
          "frame-ancestors 'self'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; ');

    // Content Security Policy - embeddable (allows external framing)
    const cspHeaderEmbeddable = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://images.pexels.com https://images.pixabay.com https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      'frame-ancestors *',
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      // Embed routes - allow external framing
      {
        source: '/embed/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, must-revalidate',
          },
          {
            key: 'Content-Security-Policy',
            value: cspHeaderEmbeddable,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      // Static assets - immutable caching
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Public assets - long cache
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // Favicon - long cache
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      // API routes - no caching
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      // All pages - revalidate on each request but allow stale
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, must-revalidate',
          },
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // X-Frame-Options for older browsers (CSP frame-ancestors takes precedence in modern browsers)
          ...(!isDev
            ? [
                {
                  key: 'X-Frame-Options',
                  value: 'SAMEORIGIN',
                },
              ]
            : []),
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ].filter(Boolean),
      },
    ];
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.(jsx|tsx)$/,
      exclude: [/node_modules/],
      use: [
        {
          loader: '@dhiwise/component-tagger/nextLoader',
        },
      ],
    });
    return config;
  },
};

export default nextConfig;
