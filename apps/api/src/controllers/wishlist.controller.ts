import { Role } from '@prisma/client';
import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import CustomResponse from '../dtos/custom-response';
import { ListResponseDto } from '../dtos/list-response.dto';
import { CreateWishlistDto, WishlistDto } from '../dtos/wishlist.dto';
import { WishlistFilterParams } from '../params/wishlist.params';
import { ReviewActor } from '../services/interfaces/Ireview.service';
import IUnitOfService from '../services/interfaces/iunitof.service';

const STAFF_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF];

export class WishlistController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) { }

  private actor = (req: Request): ReviewActor => ({
    userId: req.user?.userId as string,
    role: req.user?.role as Role,
  });

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<WishlistDto>>>> => {
    const actor = this.actor(req);
    const isStaff = STAFF_ROLES.includes(actor.role);
    const requestedUserId = req.query['userId'] as string | undefined;

    const filters: WishlistFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        productId: req.query['productId'] ? parseInt(req.query['productId'] as string) : undefined,
        // A customer is pinned to their own list; staff may inspect any user's.
        userId: isStaff ? requestedUserId : actor.userId,
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

    const data = await this.unitOfService.Wishlist.getAll(filters);
    return res.status(200).json({ success: true, message: 'Wishlist fetched successfully', data });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<WishlistDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const data = await this.unitOfService.Wishlist.getById(id, this.actor(req));
    return res.status(200).json({ success: true, message: 'Wishlist item fetched successfully', data });
  };

  has = async (req: Request, res: Response): Promise<Response<CustomResponse<{ productId: number; inWishlist: boolean }>>> => {
    const productId = parseInt(req.params['productId'] as string);
    if (isNaN(productId)) return res.status(400).json({ success: false, message: 'Invalid productId' });

    const inWishlist = await this.unitOfService.Wishlist.has(productId, this.actor(req).userId);
    return res.status(200).json({ success: true, message: 'Wishlist status fetched successfully', data: { productId, inWishlist } });
  };

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<WishlistDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }

    const { productId } = req.body as CreateWishlistDto;
    const data = await this.unitOfService.Wishlist.add(productId, this.actor(req).userId, storeCode);
    return res.status(201).json({ success: true, message: 'Added to wishlist', data });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<WishlistDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const data = await this.unitOfService.Wishlist.remove(id, this.actor(req));
    return res.status(204).json({ success: true, message: 'Removed from wishlist', data });
  };

  deleteByProduct = async (req: Request, res: Response): Promise<Response<CustomResponse<WishlistDto>>> => {
    const productId = parseInt(req.params['productId'] as string);
    if (isNaN(productId)) return res.status(400).json({ success: false, message: 'Invalid productId' });

    const data = await this.unitOfService.Wishlist.removeByProduct(productId, this.actor(req).userId);
    return res.status(204).json({ success: true, message: 'Removed from wishlist', data });
  };
}
