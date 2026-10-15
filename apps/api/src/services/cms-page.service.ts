import {
  CmsPageAccessDto,
  CmsPageConditionForm,
  CmsPageDto,
  CmsPageFilterParams,
  CmsPageListItemDto,
  CmsPageSitemapEntryDto,
  CmsPageUnlockResultDto,
  CmsPageUrlOption,
  CreateCmsPageModel,
  ListResponseDto,
  PublicCmsPageDto,
  RESERVED_CMS_SLUGS,
  UpdateCmsPageModel,
} from '@pms/types';
import { CmsPage, PageStatus, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import ClientError from '../exceptions/client-error';
import ConflictError from '../exceptions/conflict-error';
import NotFoundError from '../exceptions/not-found-error';
import UnauthorizedError from '../exceptions/unauthorized-error';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { signPageUnlockToken, verifyPageAccessToken } from '../utils/page-access.util';
import { ICmsPageService } from './interfaces/Icms-page.service';

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toDto = (row: CmsPage): CmsPageDto => ({
  id: row.id,
  storeCode: row.storeCode,
  name: row.name,
  slug: row.slug,
  urlOption: row.urlOption as CmsPageUrlOption,
  status: row.status,
  includeHeader: row.includeHeader,
  includeFooter: row.includeFooter,
  thumbnailUrl: row.thumbnailUrl,
  passwordEnabled: row.passwordEnabled,
  hasPassword: !!row.passwordHash,
  conditionEnabled: row.conditionEnabled,
  conditionForm: (row.conditionForm as CmsPageConditionForm | null) ?? null,
  htmlContent: row.htmlContent,
  cssContent: row.cssContent,
  jsContent: row.jsContent,
  metaTitle: row.metaTitle,
  metaDescription: row.metaDescription,
  metaKeywords: row.metaKeywords,
  canonicalUrl: row.canonicalUrl,
  robots: row.robots,
  ogTitle: row.ogTitle,
  ogDescription: row.ogDescription,
  ogImageUrl: row.ogImageUrl,
  schemaMarkup: (row.schemaMarkup as unknown[] | null) ?? null,
  headerScript: row.headerScript,
  afterBodyScript: row.afterBodyScript,
  footerScript: row.footerScript,
  preloadScript: row.preloadScript,
  hideFromSearch: row.hideFromSearch,
  disableRecaptcha: row.disableRecaptcha,
  excludeFromSitemap: row.excludeFromSitemap,
  sitemapPriority: row.sitemapPriority,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const toPublicDto = (row: CmsPage): PublicCmsPageDto => ({
  name: row.name,
  slug: row.slug,
  includeHeader: row.includeHeader,
  includeFooter: row.includeFooter,
  thumbnailUrl: row.thumbnailUrl,
  htmlContent: row.htmlContent,
  cssContent: row.cssContent,
  jsContent: row.jsContent,
  metaTitle: row.metaTitle,
  metaDescription: row.metaDescription,
  metaKeywords: row.metaKeywords,
  canonicalUrl: row.canonicalUrl,
  robots: row.robots,
  ogTitle: row.ogTitle,
  ogDescription: row.ogDescription,
  ogImageUrl: row.ogImageUrl,
  schemaMarkup: (row.schemaMarkup as unknown[] | null) ?? null,
  headerScript: row.headerScript,
  afterBodyScript: row.afterBodyScript,
  footerScript: row.footerScript,
  preloadScript: row.preloadScript,
  hideFromSearch: row.hideFromSearch,
  disableRecaptcha: row.disableRecaptcha,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

@injectable()
export class CmsPageService implements ICmsPageService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) {}

  /** Lowercased, de-duplicated and steered away from reserved slugs. */
  private async generateSlug(name: string, excludeId?: number): Promise<string> {
    const base = slugify(name) || 'page';
    let candidate = base;
    let suffix = 2;
    while ((RESERVED_CMS_SLUGS as readonly string[]).includes(candidate) || (await this.unitOfWork.CmsPage.slugExists(candidate, excludeId))) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private async assertSlugFree(slug: string, excludeId?: number): Promise<void> {
    if (await this.unitOfWork.CmsPage.slugExists(slug, excludeId)) {
      throw new ConflictError('A page with this URL already exists');
    }
  }

  async create(model: CreateCmsPageModel, storeCode: string, actorUserId?: string): Promise<CmsPageDto> {
    const urlOption: CmsPageUrlOption = model.urlOption ?? 'default';
    let slug: string;
    if (urlOption === 'custom' && model.slug) {
      slug = model.slug;
      await this.assertSlugFree(slug);
    } else {
      slug = await this.generateSlug(model.name);
    }

    const passwordEnabled = model.passwordEnabled ?? !!model.password;
    if (passwordEnabled && !model.password) {
      throw new ClientError('Set a page password before turning password protection on');
    }
    const passwordHash = model.password ? await bcrypt.hash(model.password, 10) : null;

    const row = await this.unitOfWork.CmsPage.create({
      storeCode,
      name: model.name,
      slug,
      urlOption,
      status: (model.status as PageStatus | undefined) ?? PageStatus.Draft,
      includeHeader: model.includeHeader ?? true,
      includeFooter: model.includeFooter ?? true,
      thumbnailUrl: model.thumbnailUrl ?? null,
      passwordEnabled,
      passwordHash,
      conditionEnabled: model.conditionEnabled ?? false,
      conditionForm: model.conditionForm ?? null,
      htmlContent: model.htmlContent ?? '',
      cssContent: model.cssContent ?? null,
      jsContent: model.jsContent ?? null,
      metaTitle: model.metaTitle ?? null,
      metaDescription: model.metaDescription ?? null,
      metaKeywords: model.metaKeywords ?? null,
      canonicalUrl: model.canonicalUrl ?? null,
      robots: model.robots ?? null,
      ogTitle: model.ogTitle ?? null,
      ogDescription: model.ogDescription ?? null,
      ogImageUrl: model.ogImageUrl ?? null,
      schemaMarkup: (model.schemaMarkup as Prisma.InputJsonValue | undefined) ?? Prisma.DbNull,
      headerScript: model.headerScript ?? null,
      afterBodyScript: model.afterBodyScript ?? null,
      footerScript: model.footerScript ?? null,
      preloadScript: model.preloadScript ?? null,
      hideFromSearch: model.hideFromSearch ?? false,
      disableRecaptcha: model.disableRecaptcha ?? false,
      excludeFromSitemap: model.excludeFromSitemap ?? false,
      sitemapPriority: model.sitemapPriority ?? 0.5,
      createdById: actorUserId ?? null,
    });

    return toDto(row);
  }

  async getAll(filters?: CmsPageFilterParams): Promise<ListResponseDto<CmsPageListItemDto>> {
    return this.unitOfWork.CmsPage.findAll(filters);
  }

  async getById(id: number, storeCode: string): Promise<CmsPageDto> {
    const row = await this.unitOfWork.CmsPage.findById(id);
    if (!row || row.storeCode !== storeCode) throw new NotFoundError('Page not found');
    return toDto(row);
  }

  async update(id: number, model: UpdateCmsPageModel, storeCode: string, actorUserId?: string): Promise<CmsPageDto> {
    const existing = await this.unitOfWork.CmsPage.findById(id);
    if (!existing || existing.storeCode !== storeCode) throw new NotFoundError('Page not found');

    const data: Prisma.CmsPageUncheckedUpdateInput = {};

    // The slug follows the name on 'default', and only an explicit new value changes it
    // on 'custom' - a published URL never moves as a side effect of an unrelated edit.
    const urlOption: CmsPageUrlOption = model.urlOption ?? (existing.urlOption as CmsPageUrlOption);
    if (urlOption !== existing.urlOption) data.urlOption = urlOption;
    if (urlOption === 'custom') {
      if (model.slug && model.slug !== existing.slug) {
        await this.assertSlugFree(model.slug, id);
        data.slug = model.slug;
      }
    } else if ((model.name && model.name !== existing.name) || existing.urlOption === 'custom') {
      data.slug = await this.generateSlug(model.name ?? existing.name, id);
    }

    if (model.removePassword) {
      data.passwordHash = null;
      data.passwordEnabled = false;
    } else {
      if (model.password) {
        data.passwordHash = await bcrypt.hash(model.password, 10);
      }
      if (model.passwordEnabled !== undefined) {
        if (model.passwordEnabled && !existing.passwordHash && !model.password) {
          throw new ClientError('Set a page password before turning password protection on');
        }
        data.passwordEnabled = model.passwordEnabled;
      }
    }

    if (model.name !== undefined) data.name = model.name;
    if (model.status !== undefined) data.status = model.status as PageStatus;
    if (model.includeHeader !== undefined) data.includeHeader = model.includeHeader;
    if (model.includeFooter !== undefined) data.includeFooter = model.includeFooter;
    if (model.thumbnailUrl !== undefined) data.thumbnailUrl = model.thumbnailUrl;
    if (model.conditionEnabled !== undefined) data.conditionEnabled = model.conditionEnabled;
    if (model.conditionForm !== undefined) data.conditionForm = model.conditionForm;
    if (model.htmlContent !== undefined) data.htmlContent = model.htmlContent;
    if (model.cssContent !== undefined) data.cssContent = model.cssContent;
    if (model.jsContent !== undefined) data.jsContent = model.jsContent;
    if (model.metaTitle !== undefined) data.metaTitle = model.metaTitle;
    if (model.metaDescription !== undefined) data.metaDescription = model.metaDescription;
    if (model.metaKeywords !== undefined) data.metaKeywords = model.metaKeywords;
    if (model.canonicalUrl !== undefined) data.canonicalUrl = model.canonicalUrl;
    if (model.robots !== undefined) data.robots = model.robots;
    if (model.ogTitle !== undefined) data.ogTitle = model.ogTitle;
    if (model.ogDescription !== undefined) data.ogDescription = model.ogDescription;
    if (model.ogImageUrl !== undefined) data.ogImageUrl = model.ogImageUrl;
    if (model.schemaMarkup !== undefined) {
      data.schemaMarkup = model.schemaMarkup === null ? Prisma.DbNull : (model.schemaMarkup as Prisma.InputJsonValue);
    }
    if (model.headerScript !== undefined) data.headerScript = model.headerScript;
    if (model.afterBodyScript !== undefined) data.afterBodyScript = model.afterBodyScript;
    if (model.footerScript !== undefined) data.footerScript = model.footerScript;
    if (model.preloadScript !== undefined) data.preloadScript = model.preloadScript;
    if (model.hideFromSearch !== undefined) data.hideFromSearch = model.hideFromSearch;
    if (model.disableRecaptcha !== undefined) data.disableRecaptcha = model.disableRecaptcha;
    if (model.excludeFromSitemap !== undefined) data.excludeFromSitemap = model.excludeFromSitemap;
    if (model.sitemapPriority !== undefined) data.sitemapPriority = model.sitemapPriority;
    if (actorUserId) data.updatedById = actorUserId;

    const row = await this.unitOfWork.CmsPage.update(id, data);
    return toDto(row);
  }

  async delete(id: number, storeCode: string): Promise<CmsPageDto> {
    const existing = await this.unitOfWork.CmsPage.findById(id);
    if (!existing || existing.storeCode !== storeCode) throw new NotFoundError('Page not found');
    const row = await this.unitOfWork.CmsPage.delete(id);
    return toDto(row);
  }

  async getPublicBySlug(slug: string, accessToken?: string): Promise<CmsPageAccessDto> {
    const row = await this.unitOfWork.CmsPage.findBySlug(slug);
    // Draft, Unpublished and Archived pages do not exist as far as the public is concerned.
    if (!row || row.status !== PageStatus.Published) throw new NotFoundError('Page not found');

    const claims = verifyPageAccessToken(accessToken);
    // An unlock token proves the visitor knew the password, which satisfies both gates.
    const unlockedByPassword = claims?.pageId === row.id;

    const locked = (reason: 'password' | 'condition'): CmsPageAccessDto => ({
      locked: true,
      reason,
      conditionForm: (row.conditionForm as CmsPageConditionForm | null) ?? null,
      preview: {
        name: row.name,
        slug: row.slug,
        metaTitle: row.metaTitle,
        metaDescription: row.metaDescription,
        thumbnailUrl: row.thumbnailUrl,
      },
    });

    if (row.passwordEnabled && row.passwordHash && !unlockedByPassword) {
      return locked('password');
    }
    if (row.conditionEnabled && row.conditionForm && !unlockedByPassword && claims?.form !== row.conditionForm) {
      return locked('condition');
    }

    return { locked: false, page: toPublicDto(row) };
  }

  async unlock(slug: string, password: string): Promise<CmsPageUnlockResultDto> {
    const row = await this.unitOfWork.CmsPage.findBySlug(slug);
    if (!row || row.status !== PageStatus.Published || !row.passwordEnabled || !row.passwordHash) {
      throw new NotFoundError('Page not found');
    }

    const matches = await bcrypt.compare(password, row.passwordHash);
    if (!matches) throw new UnauthorizedError('Incorrect page password');

    return { accessToken: signPageUnlockToken(row.id), page: toPublicDto(row) };
  }

  async getSitemapEntries(): Promise<CmsPageSitemapEntryDto[]> {
    return this.unitOfWork.CmsPage.findForSitemap();
  }
}
