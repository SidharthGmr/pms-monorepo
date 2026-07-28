import { Role } from '@prisma/client';
import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import CustomResponse from '../dtos/custom-response';
import { ListResponseDto } from '../dtos/list-response.dto';
import { CreateReviewReplyDto, ReviewReplyDto, UpdateReviewReplyDto } from '../dtos/review.dto';
import { ReviewReplyFilterParams } from '../params/review.params';
import { ReviewActor } from '../services/interfaces/Ireview.service';
import IUnitOfService from '../services/interfaces/iunitof.service';

export class ReviewReplyController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) { }

  private actor = (req: Request): ReviewActor => ({
    userId: req.user?.userId as string,
    role: req.user?.role as Role,
  });

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<ReviewReplyDto>>>> => {
    const filters: ReviewReplyFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        reviewId: req.query['reviewId'] ? parseInt(req.query['reviewId'] as string) : undefined,
        userId: req.query['userId'] as string | undefined,
        startDate: req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined,
        endDate: req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined,
        storeCode: req.user?.storeCode || undefined,
        sortBy: req.query['sortBy'] as string | undefined,
        sortOrder: req.query['sortDirection'] || req.query['sortOrder']
          ? ((req.query['sortDirection'] || req.query['sortOrder']) as string).toLowerCase() === 'desc'
            ? 'desc'
            : 'asc'
          : undefined,
      }).filter(([, v]) => v !== undefined)
    );

    const data = await this.unitOfService.ReviewReply.getAll(filters);
    return res.status(200).json({ success: true, message: 'Review replies fetched successfully', data });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<ReviewReplyDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const data = await this.unitOfService.ReviewReply.getById(id);
    return res.status(200).json({ success: true, message: 'Review reply fetched successfully', data });
  };

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<ReviewReplyDto>>> => {
    const data = await this.unitOfService.ReviewReply.create(req.body as CreateReviewReplyDto, this.actor(req));
    return res.status(201).json({ success: true, message: 'Reply added successfully', data });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<ReviewReplyDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const data = await this.unitOfService.ReviewReply.update(id, req.body as UpdateReviewReplyDto, this.actor(req));
    return res.status(200).json({ success: true, message: 'Reply updated successfully', data });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<ReviewReplyDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const data = await this.unitOfService.ReviewReply.delete(id, this.actor(req));
    return res.status(204).json({ success: true, message: 'Reply deleted successfully', data });
  };
}
