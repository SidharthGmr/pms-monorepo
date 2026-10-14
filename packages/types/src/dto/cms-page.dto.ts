import { CmsPageConditionForm, CmsPageLockReason, CmsPageUrlOption, PageStatus } from "../enum/page-status.enum";

/** Admin-facing page record. The stored password never leaves the API - only `hasPassword`. */
export interface CmsPageDto {
  id: number;
  storeCode: string;
  name: string;
  slug: string;
  urlOption: CmsPageUrlOption;
  status: PageStatus;
  includeHeader: boolean;
  includeFooter: boolean;
  thumbnailUrl: string | null;
  passwordEnabled: boolean;
  hasPassword: boolean;
  conditionEnabled: boolean;
  conditionForm: CmsPageConditionForm | null;
  htmlContent: string;
  cssContent: string | null;
  jsContent: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  robots: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  schemaMarkup: unknown[] | null;
  headerScript: string | null;
  afterBodyScript: string | null;
  footerScript: string | null;
  preloadScript: string | null;
  hideFromSearch: boolean;
  disableRecaptcha: boolean;
  excludeFromSitemap: boolean;
  sitemapPriority: number;
  createdAt: Date | string;
  updatedAt: Date | string | null;
}

export interface CmsPageListItemDto {
  id: number;
  name: string;
  slug: string;
  status: PageStatus;
  thumbnailUrl: string | null;
  passwordEnabled: boolean;
  conditionEnabled: boolean;
  hideFromSearch: boolean;
  excludeFromSitemap: boolean;
  createdAt: Date | string;
  updatedAt: Date | string | null;
}

/** Everything the public renderer needs; nothing an anonymous visitor should not see. */
export interface PublicCmsPageDto {
  name: string;
  slug: string;
  includeHeader: boolean;
  includeFooter: boolean;
  thumbnailUrl: string | null;
  htmlContent: string;
  cssContent: string | null;
  jsContent: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  robots: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  schemaMarkup: unknown[] | null;
  headerScript: string | null;
  afterBodyScript: string | null;
  footerScript: string | null;
  preloadScript: string | null;
  hideFromSearch: boolean;
  disableRecaptcha: boolean;
  createdAt: Date | string;
  updatedAt: Date | string | null;
}

/** SEO-safe stub returned for a gated page until the caller presents a valid access token. */
export interface LockedCmsPagePreviewDto {
  name: string;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
  thumbnailUrl: string | null;
}

export type CmsPageAccessDto =
  | { locked: false; page: PublicCmsPageDto }
  | { locked: true; reason: CmsPageLockReason; conditionForm: CmsPageConditionForm | null; preview: LockedCmsPagePreviewDto };

export interface CmsPageUnlockResultDto {
  accessToken: string;
  page: PublicCmsPageDto;
}

export interface CmsPageSitemapEntryDto {
  slug: string;
  sitemapPriority: number;
  createdAt: Date | string;
  updatedAt: Date | string | null;
}
