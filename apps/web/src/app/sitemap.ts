import config from '@/config';
import { CmsPageSitemapEntryDto } from '@pms/types';
import { MetadataRoute } from 'next';

/**
 * Dynamic sitemap at /sitemap.xml: the fixed storefront routes plus every published,
 * indexable CMS page. The API endpoint already leaves out drafts, pages hidden from search,
 * pages excluded from the sitemap, and gated (password/condition) pages.
 */

export const revalidate = 3600;

const BASE = (config.appUrl || 'http://localhost:3000').replace(/\/+$/, '');

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: `${BASE}/`, priority: 1 },
  { url: `${BASE}/products/`, priority: 0.9 },
  { url: `${BASE}/about-us/`, priority: 0.5 },
  { url: `${BASE}/contact-us/`, priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let pages: CmsPageSitemapEntryDto[] = [];
  try {
    const response = await fetch(`${config.apiBaseUrl}/cms-pages/public/sitemap`, {
      headers: { clientId: config.clientId },
      next: { revalidate: 3600 },
    });
    if (response.ok) {
      const body = (await response.json()) as { success: boolean; data?: CmsPageSitemapEntryDto[] };
      pages = body.data ?? [];
    }
  } catch {
    // An API hiccup should not break the whole sitemap - the static routes still serve.
  }

  return [
    ...STATIC_ROUTES,
    ...pages.map((page) => ({
      url: `${BASE}/${page.slug}/`,
      lastModified: new Date(page.updatedAt ?? page.createdAt),
      priority: page.sitemapPriority,
    })),
  ];
}
