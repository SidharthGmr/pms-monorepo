import { OrderStatus, Role } from "@prisma/client";
import { Request, Response } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { CustomResponse, ListResponseDto, OrderDto, UpdateOrderDto, UpdateOrderStatusDto, CreateOrderModel, OrderFilterParams } from '@pms/types';
import IUnitOfService from "../services/interfaces/iunitof.service";
import { MISSING_STORE_CODE } from '../constants/responses';

const STAFF_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF];

export class OrderController {
  constructor(
    private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)
  ) { }

  /** Staff may read any customer's orders; a customer is pinned to their own. */
  private isStaff = (req: Request): boolean => STAFF_ROLES.includes(req.user?.role as Role);

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<OrderDto>>>> => {
    const filters: OrderFilterParams = Object.fromEntries(
      Object.entries({
        // A customer may only ever list their own orders, whatever they ask for.
        customerId: this.isStaff(req) ? (req.query['customerId'] as string | undefined) : (req.user?.userId as string | undefined),
        storeCode: req.user?.storeCode || undefined,
        storeId: req.query['storeId'] ? parseInt(req.query['storeId'] as string, 10) : undefined,
        status: req.query['status'] as OrderStatus | undefined,
        search: req.query['search'] as string | undefined,
        startDate: req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined,
        endDate: req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined,
        page: req.query['page'] ? parseInt(req.query['page'] as string, 10) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string, 10) : undefined,
        showAllRecords: req.query['showAllRecords'] === 'true' ? true : undefined,
        sortBy: req.query['sortBy'] as string | undefined,
        sortDirection: req.query['sortDirection'] ? ((req.query['sortDirection'] as string).toLowerCase() === 'asc' ? 'asc' : 'desc') : undefined,
      }).filter(([, v]) => v !== undefined)
    );

    const orders = await this.unitOfService.Order.getAll(filters);
    return res.status(200).json({ success: true, message: "Orders fetched successfully", data: orders });
  };

  getByCustomerId = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<OrderDto>>>> => {
    const customerId = req.params["customerId"] as string;

    if (!this.isStaff(req) && customerId !== req.user?.userId) {
      return res.status(403).json({ success: false, message: "You can only view your own orders" });
    }

    const orders = await this.unitOfService.Order.getByCustomerId(customerId);
    return res.status(200).json({ success: true, message: "Orders fetched successfully", data: { totalRecord: orders.length, data: orders } });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<OrderDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const order = await this.unitOfService.Order.getById(id);

    // Same rule as the list endpoints: staff read their own store, a customer only their own order.
    if (order) {
      if (this.isStaff(req)) {
        if (req.user?.storeCode && order.storeCode !== req.user.storeCode) {
          return res.status(403).json({ success: false, message: "This order belongs to another store" });
        }
      } else if (order.customerId !== req.user?.userId) {
        return res.status(403).json({ success: false, message: "You can only view your own orders" });
      }
    }

    return res.status(200).json({ success: true, message: "Order fetched successfully", data: order });
  };

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<OrderDto>>> => {
    const body = req.body as CreateOrderModel;

    const storeCode = req.user?.storeCode;

    if (!storeCode) {
      return res.status(400).json(MISSING_STORE_CODE);
    }

    // The audit trail always comes from the token, never the body.
    const createdById = req.user?.userId;
    const createdByName = req.user?.name;

    const isStaff = this.isStaff(req);
    const { status, orderDate, createdById: _ignoredId, createdByName: _ignoredName, ...rest } = body;
    const model: CreateOrderModel = {
      ...rest,
      // A customer orders for themselves; staff order for the customer they picked.
      customerId: isStaff ? body.customerId : (req.user?.userId as string),
      // Status and backdating are operator tools; a customer's order starts PENDING today.
      ...(isStaff && status !== undefined && { status }),
      ...(isStaff && orderDate !== undefined && { orderDate }),
    };

    const order = await this.unitOfService.Order.create(model, storeCode, createdById as string, createdByName as string);
    return res.status(201).json({ success: true, message: "Order created successfully", data: order });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<OrderDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const body = req.body as UpdateOrderDto;
    const order = await this.unitOfService.Order.update(id, body, req.user?.storeCode || undefined);
    return res.status(200).json({ success: true, message: "Order updated successfully", data: order });
  };

  updateStatus = async (req: Request, res: Response): Promise<Response<CustomResponse<OrderDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });

    const { status } = req.body as UpdateOrderStatusDto;
    const order = await this.unitOfService.Order.updateStatus(id, status, req.user?.storeCode || undefined);
    return res.status(200).json({ success: true, message: "Order status updated successfully", data: order });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<OrderDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const order = await this.unitOfService.Order.delete(id, req.user?.storeCode || undefined);
    return res.status(200).json({ success: true, message: "Order deleted successfully", data: order });
  };
}
