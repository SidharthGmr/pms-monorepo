/**
 * Every environment-driven value the web app reads, in one place. Components and
 * services import this rather than touching process.env, so a renamed variable is a
 * one-line change here instead of a hunt through the tree.
 *
 * Only NEXT_PUBLIC_* values are safe to read on the client; Next.js inlines them at
 * build time. Anything secret (Cloudinary API secret, NEXTAUTH_SECRET) must stay in
 * server-only code and must never be given the NEXT_PUBLIC_ prefix.
 */
const config = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'PMS',
  appDescription: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Product & Inventory Management System',
  appUrl: process.env.NEXT_PUBLIC_MAIN_DOMAIN_URL || '',
  // Two names have been used for this in .env files; accept either so an existing
  // deployment keeps its CDN after the rename. Empty falls back to /public.
  cdnUrl: (process.env.NEXT_PUBLIC_CDN_BASE_URL || process.env.NEXT_PUBLIC_CDN_MAIN_DOMAIN_URL || '').replace(/\/$/, ''),
  apiBaseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, ''),
  clientId: process.env.NEXT_PUBLIC_API_CLIENT_ID || '',
  recordPerPage: Number(process.env.NEXT_PUBLIC_DEFAULT_RECORD_PER_PAGE) || 25,
  environment: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  recaptchaSitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '',
  gtmId: process.env.NEXT_PUBLIC_GTM_ID || '',
  cloudinaryCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
};

export default config;
