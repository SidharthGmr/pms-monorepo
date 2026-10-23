import { Prisma, ReturnStatus, ReturnType } from '@prisma/client';
import { ListResponseDto, OrderReturnDto, OrderReturnFilterParams, ReturnedQuantityDto } from '@pms/types';
import prisma from '../config/prisma';
import { IOrderReturnRepository } from './interfaces/iorder-return.repository';

// Sorting is client-driven, so only real columns are honoured - anything else falls
// back to the default instead of failing the query.
const SORTABLE_COLUMNS = new Set(['returnNumber', 'type', 'status', 'refundAmount', 'resolvedAt', 'createdAt', 'updatedAt', 'id']);

// REJECTED and CANCELLED returns hold no claim on stock or money; everything else does,
// COMPLETED included - a completed return has already restocked, so it must keep blocking the
// whole-order restock path or those units would come back twice.
export const ACTIVE_RETURN_STATUSES: ReturnStatus[] = [ReturnStatus.REQUESTED, ReturnStatus.APPROVED, ReturnStatus.RECEIVED, ReturnStatus.COMPLETED];

export const orderReturnSelect = {
  id: true,
  returnNumber: true,
  orderId: true,
  storeCode: true,
  customerId: true,
  type: true,
  status: true,
  reason: true,
  notes: true,
  refundAmount: true,
  refundMethod: true,
  refundTransactionId: true,
  exchangeOrderId: true,
  requestedById: true,
  processedById: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      orderItemId: true,
      productId: true,
      variantId: true,
      quantity: true,
      unitPrice: true,
      amount: true,
      condition: true,
      variant: { select: { name: true, sku: true } },
      product: { select: { name: true } },
    },
  },
  order: { select: { orderNumber: true, grandTotal: true, status: true } },
  exchangeOrder: { select: { orderNumber: true, grandTotal: true } },
  customer: { select: { name: true, email: true, phone: true } },
} satisfies Prisma.orderReturnSelect;

export class OrderReturnRepository implements IOrderReturnRepository {
  async findAll(filters?: OrderReturnFilterParams): Promise<ListResponseDto<OrderReturnDto>> {
    const where: Prisma.orderReturnWhereInput = {};
    let page = 1;
    let limit = 10;

    if (filters) {
      page = filters.page ?? page;
      limit = filters.recordPerPage ?? limit;

      if (filters.search) {
        where.OR = [
          { returnNumber: { contains: filters.search, mode: 'insensitive' } },
          { order: { orderNumber: { contains: filters.search, mode: 'insensitive' } } },
          { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
        ];
      }

      if (filters.storeCode !== undefined) where.storeCode = filters.storeCode;
      if (filters.orderId != null) where.orderId = filters.orderId;
      if (filters.status) where.status = filters.status as ReturnStatus;
      if (filters.type) where.type = filters.type as ReturnType;

      if (filters.startDate != null || filters.endDate != null) {
        where.createdAt = {
          ...(filters.startDate != null && { gte: filters.startDate }),
          ...(filters.endDate != null && { lte: filters.endDate }),
        };
      }
    }

    const showAll = filters?.showAllRecords === true;
    const skip = showAll ? undefined : (page - 1) * limit;
    const take = showAll ? undefined : limit;

    const sortBy = filters?.sortBy && SORTABLE_COLUMNS.has(filters.sortBy) ? filters.sortBy : 'createdAt';
    const direction: Prisma.SortOrder = String(filters?.sortDirection).toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.orderReturnOrderByWithRelationInput[] =
      sortBy === 'resolvedAt' ? [{ resolvedAt: { sort: direction, nulls: 'last' } }, { id: 'desc' }] : [{ [sortBy]: direction }, { id: 'desc' }];

    const [data, total] = await Promise.all([
      prisma.orderReturn.findMany({
        where,
        orderBy,
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
        select: orderReturnSelect,
      }),
      prisma.orderReturn.count({ where }),
    ]);

    return { totalRecord: total, data };
  }

  async findById(id: number): Promise<OrderReturnDto | null> {
    return prisma.orderReturn.findUnique({ where: { id }, select: orderReturnSelect });
  }

  async findByCustomerId(customerId: string): Promise<OrderReturnDto[]> {
    return prisma.orderReturn.findMany({ where: { customerId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], select: orderReturnSelect });
  }

  async sumActiveByOrderItem(orderId: number, excludeReturnId?: number): Promise<ReturnedQuantityDto[]> {
    const rows = await prisma.orderReturnItem.groupBy({
      by: ['orderItemId'],
      where: {
        return: {
          orderId,
          status: { in: ACTIVE_RETURN_STATUSES },
          ...(excludeReturnId !== undefined && { id: { not: excludeReturnId } }),
        },
      },
      _sum: { quantity: true },
    });
    return rows.map((row) => ({ orderItemId: row.orderItemId, quantity: row._sum.quantity ?? 0 }));
  }

  async countActiveByOrder(orderId: number): Promise<number> {
    return prisma.orderReturn.count({ where: { orderId, status: { in: ACTIVE_RETURN_STATUSES } } });
  }

  async sumActiveRefundByOrder(orderId: number, excludeReturnId?: number): Promise<number> {
    const row = await prisma.orderReturn.aggregate({
      where: {
        orderId,
        status: { in: ACTIVE_RETURN_STATUSES },
        ...(excludeReturnId !== undefined && { id: { not: excludeReturnId } }),
      },
      _sum: { refundAmount: true },
    });
    return row._sum.refundAmount ?? 0;
  }
}
