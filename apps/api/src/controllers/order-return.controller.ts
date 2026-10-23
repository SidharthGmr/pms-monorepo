import { CustomResponse, ListResponseDto, OrderReturnDto, OrderReturnFilterParams, OrderReturnModel, OrderReturnStatusModel } from '@pms/types';
import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { MISSING_STORE_CODE, MISSING_USER_ID } from '../constants/responses';
import IUnitOfService from '../services/interfaces/iunitof.service';

const isAdminRole = (role?: string) => role === Role.ADMIN || role === Role.SUPER_ADMIN;
const STAFF_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF];

export class OrderReturnController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) {}

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<OrderReturnDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json(MISSING_USER_ID);

    const body = req.body as OrderReturnModel;
    const orderReturn = await this.unitOfService.OrderReturn.create(body, storeCode, userId, req.user?.name ?? '', isAdminRole(req.user?.role));
    return res.status(201).json({ success: true, message: 'Return created successfully', data: orderReturn });
  };

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<OrderReturnDto>>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);

    const filters: OrderReturnFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        status: req.query['status'] as string | undefined,
        type: req.query['type'] as string | undefined,
        orderId: req.query['orderId'] ? parseInt(req.query['orderId'] as string) : undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        startDate: req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined,
        endDate: req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined,
        storeCode,
        sortBy: req.query['sortBy'] as string | undefined,
        sortDirection: (req.query['sortDirection'] || req.query['sortOrder']) as string | undefined,
      }).filter(([, value]) => value !== undefined)
    );
    const result = await this.unitOfService.OrderReturn.getAll(filters);
    return res.status(200).json({ success: true, message: 'Returns fetched successfully', data: { totalRecord: result.totalRecord, data: result.data } });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<OrderReturnDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);

    const orderReturn = await this.unitOfService.OrderReturn.getById(id, storeCode);
    return res.status(200).json({ success: true, message: 'Return fetched successfully', data: orderReturn });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<OrderReturnDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);

    const body = req.body as OrderReturnModel;
    const orderReturn = await this.unitOfService.OrderReturn.update(id, body, storeCode, isAdminRole(req.user?.role));
    return res.status(200).json({ success: true, message: 'Return updated successfully', data: orderReturn });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<OrderReturnDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);

    const orderReturn = await this.unitOfService.OrderReturn.delete(id, storeCode);
    return res.status(200).json({ success: true, message: 'Return deleted successfully', data: orderReturn });
  };

  updateStatus = async (req: Request, res: Response): Promise<Response<CustomResponse<OrderReturnDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json(MISSING_USER_ID);

    const body = req.body as OrderReturnStatusModel;
    const orderReturn = await this.unitOfService.OrderReturn.updateStatus(id, body, storeCode, userId, isAdminRole(req.user?.role));
    return res.status(200).json({ success: true, message: 'Return status updated successfully', data: orderReturn });
  };

  getReturnedQuantities = async (req: Request, res: Response): Promise<Response<CustomResponse<unknown>>> => {
    const orderId = parseInt(req.params['orderId'] as string);
    if (isNaN(orderId)) return res.status(400).json({ success: false, message: 'Invalid order id' });

    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);

    const quantities = await this.unitOfService.OrderReturn.getReturnedQuantities(orderId, storeCode);
    return res.status(200).json({ success: true, message: 'Returned quantities fetched successfully', data: quantities });
  };

  getByCustomerId = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<OrderReturnDto>>>> => {
    const customerId = req.params['customerId'] as string;

    // Staff may read any customer's returns; a customer is pinned to their own - the same
    // rule the orders endpoint applies.
    if (!STAFF_ROLES.includes(req.user?.role as Role) && customerId !== req.user?.userId) {
      return res.status(403).json({ success: false, message: 'You can only view your own returns' });
    }

    const orderReturns = await this.unitOfService.OrderReturn.getByCustomerId(customerId);
    return res.status(200).json({ success: true, message: 'Returns fetched successfully', data: { totalRecord: orderReturns.length, data: orderReturns } });
  };
}
