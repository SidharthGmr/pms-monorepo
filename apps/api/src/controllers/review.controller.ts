import { Role, Status } from '@prisma/client';
import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import CustomResponse from '../dtos/custom-response';
import { ListResponseDto } from '../dtos/list-response.dto';
import { CreateReviewDto, ReviewDto, ReviewSummaryDto, UpdateReviewDto } from '../dtos/review.dto';
import { ReviewFilterParams } from '../params/review.params';
import { ReviewActor } from '../services/interfaces/Ireview.service';
import IUnitOfService from '../services/interfaces/iunitof.service';

const STAFF_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF];

export class ReviewController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) { }

  private actor = (req: Request): ReviewActor => ({
    userId: req.user?.userId as string,
    role: req.user?.role as Role,
  });

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<ReviewDto>>>> => {
    const actor = this.actor(req);
    const isStaff = STAFF_ROLES.includes(actor.role);

    // A customer only ever sees their own reviews; staff may filter by any user.
    const requestedUserId = req.query['userId'] as string | undefined;

    const filters: ReviewFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        status: req.query['status'] ? (req.query['status'] as Status) : undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        productId: req.query['productId'] ? parseInt(req.query['productId'] as string) : undefined,
        orderId: req.query['orderId'] ? parseInt(req.query['orderId'] as string) : undefined,
        userId: isStaff ? requestedUserId : actor.userId,
        rating: req.query['rating'] ? parseInt(req.query['rating'] as string) : undefined,
        minRating: req.query['minRating'] ? parseInt(req.query['minRating'] as string) : undefined,
        isVerified: req.query['isVerified'] !== undefined ? req.query['isVerified'] === 'true' : undefined,
        startDate: req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined,
        endDate: req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined,
        storeCode: req.user?.storeCode || undefined,
        sortBy: req.query['sortBy'] as string | undefined,
        sortOrder: req.query['sortDirection'] || req.query['sortOrder']
          ? ((req.query['sortDirection'] || req.query['sortOrder']) as string).toLowerCase() === 'asc'
            ? 'asc'
            : 'desc'
          : undefined,
      }).filter(([, v]) => v !== undefined)
    );

    const data = await this.unitOfService.Review.getAll(filters);
    return res.status(200).json({ success: true, message: 'Reviews fetched successfully', data });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<ReviewDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const data = await this.unitOfService.Review.getById(id);
    return res.status(200).json({ success: true, message: 'Review fetched successfully', data });
  };

  getSummary = async (req: Request, res: Response): Promise<Response<CustomResponse<ReviewSummaryDto>>> => {
    const productId = parseInt(req.params['productId'] as string);
    if (isNaN(productId)) return res.status(400).json({ success: false, message: 'Invalid productId' });
    const data = await this.unitOfService.Review.getSummary(productId);
    return res.status(200).json({ success: true, message: 'Review summary fetched successfully', data });
  };

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<ReviewDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }

    const data = await this.unitOfService.Review.create(req.body as CreateReviewDto, this.actor(req), storeCode);
    return res.status(201).json({ success: true, message: 'Review created successfully', data });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<ReviewDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const data = await this.unitOfService.Review.update(id, req.body as UpdateReviewDto, this.actor(req));
    return res.status(200).json({ success: true, message: 'Review updated successfully', data });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<ReviewDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const data = await this.unitOfService.Review.delete(id, this.actor(req));
    return res.status(204).json({ success: true, message: 'Review deleted successfully', data });
  };
}
