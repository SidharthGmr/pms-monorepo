import { CmsPageConditionForm, CmsPageUrlOption, PageStatus } from "../enum/page-status.enum";

export interface CreateCmsPageModel {
  name: string;
  /** Required when urlOption is 'custom'; generated from the name otherwise. */
  slug?: string | null;
  urlOption?: CmsPageUrlOption;
  status?: PageStatus;
  includeHeader?: boolean;
  includeFooter?: boolean;
  thumbnailUrl?: string | null;
  passwordEnabled?: boolean;
  /** Plaintext in transit only - the API stores a bcrypt hash and discards this. */
  password?: string | null;
  /** True clears the stored hash and turns protection off. */
  removePassword?: boolean;
  conditionEnabled?: boolean;
  conditionForm?: CmsPageConditionForm | null;
  htmlContent?: string;
  cssContent?: string | null;
  jsContent?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  canonicalUrl?: string | null;
  robots?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageUrl?: string | null;
  schemaMarkup?: unknown[] | null;
  headerScript?: string | null;
  afterBodyScript?: string | null;
  footerScript?: string | null;
  preloadScript?: string | null;
  hideFromSearch?: boolean;
  disableRecaptcha?: boolean;
  excludeFromSitemap?: boolean;
  sitemapPriority?: number;
}

export type UpdateCmsPageModel = Partial<CreateCmsPageModel>;

export interface UnlockCmsPageModel {
  password: string;
}
