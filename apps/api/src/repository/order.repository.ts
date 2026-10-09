import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { OrderDto, UpdateOrderDto } from "../dtos/order.dto";
import { ListResponseDto } from "../dtos/list-response.dto";
import { CreateOrderModel } from "../models/order.model";
import { IOrderRepository } from "./interfaces/iorder.repository";
import { OrderFilterParams } from "../params/order.params";

const SORTABLE_COLUMNS = new Set(['orderNumber', 'grandTotal', 'status', 'createdAt', 'updatedAt', 'id']);

export class OrderRepository implements IOrderRepository {
  async findAll(filters?: OrderFilterParams): Promise<ListResponseDto<OrderDto>> {
    const where: Prisma.orderWhereInput = {};
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.recordPerPage && filters.recordPerPage > 0 ? filters.recordPerPage : 10;

    if (filters) {
      if (filters.customerId) {
        where.customerId = filters.customerId;
      }
      if (filters.storeId) {
        where.store = { id: filters.storeId };
      }
      if (filters.storeCode) {
        where.storeCode = filters.storeCode;
      }
      if (filters.status) {
        where.status = filters.status;
      }

      // The order number is what staff read off a bill; the customer columns are what they
      // are asked for on the phone, so both answer the one search box.
      if (filters.search) {
        where.OR = [
          { orderNumber: { contains: filters.search, mode: 'insensitive' } },
          { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
          { customer: { email: { contains: filters.search, mode: 'insensitive' } } },
          { customer: { phone: { contains: filters.search, mode: 'insensitive' } } },
        ];
      }

      if (filters.startDate !== undefined || filters.endDate !== undefined) {
        where.createdAt = {
          ...(filters.startDate !== undefined && { gte: filters.startDate }),
          ...(filters.endDate !== undefined && { lte: filters.endDate }),
        };
      }
    }

    const column = filters?.sortBy && SORTABLE_COLUMNS.has(filters.sortBy) ? filters.sortBy : 'createdAt';
    const direction: Prisma.SortOrder = filters?.sortDirection === 'asc' ? 'asc' : 'desc';
    const showAll = filters?.showAllRecords === true;

    const [data, totalRecord] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: [{ [column]: direction }, { id: 'desc' }],
        ...(showAll ? {} : { skip: (page - 1) * limit, take: limit }),
        include: {
          customer: true,
          store: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { totalRecord, data };
  }

  async findByCustomerId(customerId: string): Promise<OrderDto[]> {
    return prisma.order.findMany({
      where: { customerId },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: true,
        store: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async findById(id: number): Promise<OrderDto | null> {
    return prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        store: true,
        items: {
          include: {
            product: true,
            variant: { select: { id: true, name: true, sku: true, images: true } },
          },
        },
      },
    });
  }

  async update(id: number, data: UpdateOrderDto): Promise<OrderDto> {
    return prisma.order.update({ where: { id }, data });
  }

  async delete(id: number): Promise<OrderDto> {
    return prisma.order.delete({ where: { id } });
  }
}
