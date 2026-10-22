import { CmsPageAccessDto, CmsPageDto, CmsPageFilterParams, CmsPageListItemDto, CmsPageSitemapEntryDto, CmsPageUnlockResultDto, CreateCmsPageModel, CustomResponse, ListResponseDto, PageStatus, UpdateCmsPageModel } from '@pms/types';
import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { MISSING_STORE_CODE } from '../constants/responses';
import IUnitOfService from '../services/interfaces/iunitof.service';

export class CmsPageController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) {}

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<CmsPageDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);

    const data = await this.unitOfService.CmsPage.create(req.body as CreateCmsPageModel, storeCode, req.user?.userId);
    return res.status(201).json({ success: true, message: 'Page created successfully', data });
  };

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<CmsPageListItemDto>>>> => {
    const filters: CmsPageFilterParams = Object.fromEntries(
      Object.entries({
        status: req.query['status'] as PageStatus | undefined,
        search: req.query['search'] as string | undefined,
        startDate: req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined,
        endDate: req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined,
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        storeCode: req.user?.storeCode || undefined,
        sortBy: req.query['sortBy'] as string | undefined,
        sortDirection: req.query['sortDirection'] as string | undefined,
      }).filter(([, v]) => v !== undefined)
    );

    const data = await this.unitOfService.CmsPage.getAll(filters);
    return res.status(200).json({ success: true, message: 'Pages fetched successfully', data });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<CmsPageDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);

    const data = await this.unitOfService.CmsPage.getById(id, storeCode);
    return res.status(200).json({ success: true, message: 'Page fetched successfully', data });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<CmsPageDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);

    const data = await this.unitOfService.CmsPage.update(id, req.body as UpdateCmsPageModel, storeCode, req.user?.userId);
    return res.status(200).json({ success: true, message: 'Page updated successfully', data });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<CmsPageDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);

    const data = await this.unitOfService.CmsPage.delete(id, storeCode);
    return res.status(200).json({ success: true, message: 'Page deleted successfully', data });
  };

  // The storefront renders pages without an account, so these run with no token. Gated
  // pages come back as a locked stub until a valid x-page-access token is presented.
  getPublicBySlug = async (req: Request, res: Response): Promise<Response<CustomResponse<CmsPageAccessDto>>> => {
    const slug = (req.params['slug'] as string | undefined)?.trim().toLowerCase();
    if (!slug) return res.status(400).json({ success: false, message: 'Invalid slug' });

    const accessToken = req.headers['x-page-access'] as string | undefined;
    const data = await this.unitOfService.CmsPage.getPublicBySlug(slug, accessToken);
    return res.status(200).json({ success: true, message: 'Page fetched successfully', data });
  };

  unlock = async (req: Request, res: Response): Promise<Response<CustomResponse<CmsPageUnlockResultDto>>> => {
    const slug = (req.params['slug'] as string | undefined)?.trim().toLowerCase();
    if (!slug) return res.status(400).json({ success: false, message: 'Invalid slug' });

    const data = await this.unitOfService.CmsPage.unlock(slug, (req.body as { password: string }).password);
    return res.status(200).json({ success: true, message: 'Page unlocked', data });
  };

  getSitemapEntries = async (_req: Request, res: Response): Promise<Response<CustomResponse<CmsPageSitemapEntryDto[]>>> => {
    const data = await this.unitOfService.CmsPage.getSitemapEntries();
    return res.status(200).json({ success: true, message: 'Sitemap entries fetched successfully', data });
  };
}
