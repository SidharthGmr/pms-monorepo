import { CmsPageFilterParams, CmsPageListItemDto, CmsPageSitemapEntryDto } from "@pms/types";
import { CmsPage, PageStatus, Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { ListResponseDto } from "../dtos/list-response.dto";
import { ICmsPageRepository } from "./interfaces/icms-page.repository";

const SORTABLE_COLUMNS = new Set(['name', 'slug', 'status', 'createdAt', 'updatedAt', 'id']);

const listSelect = {
  id: true,
  name: true,
  slug: true,
  status: true,
  thumbnailUrl: true,
  passwordEnabled: true,
  conditionEnabled: true,
  hideFromSearch: true,
  excludeFromSitemap: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CmsPageSelect;

export class CmsPageRepository implements ICmsPageRepository {
  async create(data: Prisma.CmsPageUncheckedCreateInput): Promise<CmsPage> {
    return prisma.cmsPage.create({ data });
  }

  async findAll(filters?: CmsPageFilterParams): Promise<ListResponseDto<CmsPageListItemDto>> {
    const where: Prisma.CmsPageWhereInput = {};
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.recordPerPage && filters.recordPerPage > 0 ? filters.recordPerPage : 10;

    if (filters) {
      if (filters.status) {
        where.status = filters.status as PageStatus;
      }

      if (filters.storeCode) {
        where.storeCode = filters.storeCode;
      }

      if (filters.search) {
        const match = { contains: filters.search, mode: 'insensitive' as const };
        where.AND = [{ OR: [{ name: match }, { slug: match }, { metaTitle: match }] }];
      }

      if (filters.startDate !== undefined || filters.endDate !== undefined) {
        where.createdAt = {
          ...(filters.startDate != null && { gte: new Date(filters.startDate) }),
          ...(filters.endDate != null && { lte: new Date(filters.endDate) }),
        };
      }
    }

    const column = filters?.sortBy && SORTABLE_COLUMNS.has(filters.sortBy) ? filters.sortBy : 'createdAt';
    const direction: Prisma.SortOrder = String(filters?.sortDirection ?? '').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const showAll = filters?.showAllRecords === true;

    const [data, totalRecord] = await Promise.all([
      prisma.cmsPage.findMany({
        where,
        orderBy: [{ [column]: direction }, { id: 'desc' }],
        ...(showAll ? {} : { skip: (page - 1) * limit, take: limit }),
        select: listSelect,
      }),
      prisma.cmsPage.count({ where }),
    ]);

    return { totalRecord, data };
  }

  async findById(id: number): Promise<CmsPage | null> {
    return prisma.cmsPage.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<CmsPage | null> {
    return prisma.cmsPage.findUnique({ where: { slug } });
  }

  async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    const row = await prisma.cmsPage.findFirst({
      where: { slug, ...(excludeId !== undefined && { id: { not: excludeId } }) },
      select: { id: true },
    });
    return !!row;
  }

  async update(id: number, data: Prisma.CmsPageUncheckedUpdateInput): Promise<CmsPage> {
    return prisma.cmsPage.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
  }

  async delete(id: number): Promise<CmsPage> {
    return prisma.cmsPage.delete({ where: { id } });
  }

  async findForSitemap(): Promise<CmsPageSitemapEntryDto[]> {
    // Gated pages stay out of the public sitemap even when indexable - a crawler could
    // never read them anyway, and the sitemap should not advertise protected URLs.
    return prisma.cmsPage.findMany({
      where: {
        status: PageStatus.Published,
        hideFromSearch: false,
        excludeFromSitemap: false,
        passwordEnabled: false,
        conditionEnabled: false,
      },
      orderBy: [{ sitemapPriority: 'desc' }, { id: 'asc' }],
      select: { slug: true, sitemapPriority: true, createdAt: true, updatedAt: true },
    });
  }
}
