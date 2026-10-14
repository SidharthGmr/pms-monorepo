import Footer from '@/components/Header/Footer';
import Header from '@/components/Header/Header';
import PageLock from '@/components/features/cms-pages/public/page-lock';
import config from '@/config';
import { FORM_ACCESS_COOKIE, pageAccessCookie } from '@/lib/page-access';
import { CmsPageAccessDto } from '@pms/types';
import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

/**
 * Public renderer for admin-authored CMS pages at /<slug>. Static routes always win in
 * Next.js, so this only ever sees URLs no real route owns. The page is fetched on the
 * server (first server-side API fetch in the app) so SEO tags, scripts and JSON-LD are in
 * the initial HTML; gate tokens ride in on cookies and go to the API as x-page-access.
 */

interface CmsPublicPageProps {
  params: { slug: string };
}

const requestPage = async (slug: string, token?: string): Promise<CmsPageAccessDto | null> => {
  const response = await fetch(`${config.apiBaseUrl}/cms-pages/public/${encodeURIComponent(slug)}`, {
    headers: { clientId: config.clientId, ...(token ? { 'x-page-access': token } : {}) },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const body = (await response.json()) as { success: boolean; data?: CmsPageAccessDto };
  return body.success ? (body.data ?? null) : null;
};

// Next memoizes identical fetch() calls within one render, so generateMetadata and the page
// share the underlying lookups without any module-level cache (which could leak gated content
// between visitors).
const fetchAccess = async (slug: string): Promise<CmsPageAccessDto | null> => {
  const jar = cookies();
  const unlockToken = jar.get(pageAccessCookie(slug))?.value;
  const formToken = jar.get(FORM_ACCESS_COOKIE)?.value;

  let access = await requestPage(slug, unlockToken ?? formToken);
  // A page can be both password- and condition-gated; when the first token did not open it,
  // the other one gets a try before the visitor sees the lock screen.
  if (access && access.locked && unlockToken && formToken) {
    access = (await requestPage(slug, formToken)) ?? access;
  }
  return access;
};

export async function generateMetadata({ params }: CmsPublicPageProps): Promise<Metadata> {
  // notFound() belongs here rather than only in the component: metadata resolves first, and a
  // notFound() raised after it leaves the response committed as 200.
  const access = await fetchAccess(params.slug);
  if (!access) notFound();

  if (access.locked) {
    // Gated pages advertise their name but never their content, and crawlers skip them.
    return {
      title: `${access.preview.metaTitle || access.preview.name} - ${config.appName}`,
      ...(access.preview.metaDescription ? { description: access.preview.metaDescription } : {}),
      robots: 'noindex, nofollow',
    };
  }

  const page = access.page;
  return {
    title: page.metaTitle || `${page.name} - ${config.appName}`,
    ...(page.metaDescription ? { description: page.metaDescription } : {}),
    ...(page.metaKeywords ? { keywords: page.metaKeywords } : {}),
    robots: page.hideFromSearch ? 'noindex, nofollow' : (page.robots ?? 'index, follow'),
    ...(page.canonicalUrl ? { alternates: { canonical: page.canonicalUrl } } : {}),
    openGraph: {
      title: page.ogTitle || page.metaTitle || page.name,
      ...(page.ogDescription || page.metaDescription ? { description: (page.ogDescription || page.metaDescription) as string } : {}),
      ...(page.ogImageUrl || page.thumbnailUrl ? { images: [(page.ogImageUrl || page.thumbnailUrl) as string] } : {}),
      type: 'website',
    },
  };
}

/** Raw admin-authored fragments (scripts, resource hints). They execute because they are part
 *  of the server-rendered document; this is trusted, ADMIN-only content by design. */
const RawHtml = ({ html }: { html: string }) => <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;

export default async function CmsPublicPage({ params }: CmsPublicPageProps) {
  const access = await fetchAccess(params.slug);
  if (!access) notFound();

  if (access.locked) {
    return (
      <>
        <Header />
        <PageLock slug={params.slug} reason={access.reason} conditionForm={access.conditionForm} preview={access.preview} />
        <Footer />
      </>
    );
  }

  const page = access.page;
  const schemaObjects = page.schemaMarkup ?? [];

  return (
    <>
      {page.afterBodyScript && <RawHtml html={page.afterBodyScript} />}
      {page.includeHeader && <Header />}

      {page.preloadScript && <RawHtml html={page.preloadScript} />}
      {page.headerScript && <RawHtml html={page.headerScript} />}
      {schemaObjects.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaObjects.length === 1 ? schemaObjects[0] : schemaObjects) }}
        />
      )}
      {page.cssContent && <style dangerouslySetInnerHTML={{ __html: page.cssContent }} />}

      <main dangerouslySetInnerHTML={{ __html: page.htmlContent }} />

      {page.jsContent && <script dangerouslySetInnerHTML={{ __html: page.jsContent }} />}
      {page.footerScript && <RawHtml html={page.footerScript} />}
      {page.includeFooter && <Footer />}
    </>
  );
}
