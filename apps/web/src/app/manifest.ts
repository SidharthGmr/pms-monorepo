import config from '@/config';
import { MetadataRoute } from 'next';

/**
 * Web app manifest, served at /manifest.webmanifest. The file convention also injects the
 * <link rel="manifest"> tag, so the root layout must not declare `manifest` itself.
 *
 * Metadata routes keep their own path under `trailingSlash: true` - the redirect only adds a
 * slash to paths whose last segment has no extension - so this never 308s the way /offline does.
 */

export const dynamic = 'force-static';

// Home screens truncate past roughly 12 characters, and the name comes from an env var.
const SHORT_NAME_LIMIT = 12;

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: config.appName,
    short_name: config.appName.slice(0, SHORT_NAME_LIMIT),
    description: config.appDescription,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    // No `orientation` on purpose: the admin tables and the 1920x1080 camera capture are both
    // better in landscape, and on Android this field locks the whole app rather than hinting.
    background_color: '#ffffff',
    theme_color: '#092a55',
    lang: 'en',
    dir: 'ltr',
    categories: ['business', 'productivity', 'shopping'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Separate entries, never `any maskable` on one: that would let Android crop the
      // full-bleed icons above, which have no safe-zone padding.
      { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
