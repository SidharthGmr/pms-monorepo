/** @type {import('next').NextConfig} */

const isProduction = process.env.NODE_ENV === 'production';

// Hosts that next/image may optimize. The CDN and API hosts come from env so a new
// deployment does not need a code change to show its own images.
function remotePatternFor(url) {
  if (!url) return null;
  try {
    const { protocol, hostname, port } = new URL(url);
    return { protocol: protocol.replace(':', ''), hostname, ...(port ? { port } : {}) };
  } catch {
    return null;
  }
}

const remotePatterns = [
  { protocol: 'https', hostname: 'res.cloudinary.com' },
  remotePatternFor(process.env.NEXT_PUBLIC_CDN_BASE_URL || process.env.NEXT_PUBLIC_CDN_MAIN_DOMAIN_URL),
  remotePatternFor(process.env.NEXT_PUBLIC_API_BASE_URL),
  ...(isProduction ? [] : [{ protocol: 'http', hostname: 'localhost' }]),
].filter(Boolean);

// Sent on every response. HSTS is only meaningful over TLS, which every
// production host provides; sending it in development would pin localhost.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
  ...(isProduction ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
];

const nextConfig = {
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@pms/types'],
  eslint: {
    // Lint is a build gate again now that the tree is clean; CI runs it too.
    ignoreDuringBuilds: false,
  },
  compiler: {
    // Debug logging does not belong in the shipped bundle; errors stay so the
    // browser console still shows real failures.
    removeConsole: isProduction ? { exclude: ['error', 'warn'] } : false,
  },
  images: {
    remotePatterns,
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    return [
      {
        source: '/app/gmr',
        destination: '/gmr',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
