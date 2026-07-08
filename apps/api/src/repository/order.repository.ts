import prisma from "../config/prisma";
import { OrderDto, UpdateOrderDto } from "../dtos/order.dto";
import { CreateOrderModel } from "../models/order.model";
import { IOrderRepository } from "./interfaces/iorder.repository";
import { OrderFilterParams } from "../params/order.params";

export class OrderRepository implements IOrderRepository {
  async findAll(filters?: OrderFilterParams): Promise<OrderDto[]> {
    const where: any = {};
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
    }
    return prisma.order.findMany({
      where,
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
          },
        },
      },
    });
  }

  async create(data: CreateOrderModel, storeCode: string): Promise<OrderDto> {
    throw new Error("Order creation with items must be done via UnitOfWork transaction in OrderService");
  }


  async update(id: number, data: UpdateOrderDto): Promise<OrderDto> {
    return prisma.order.update({ where: { id }, data });
  }

  async delete(id: number): Promise<OrderDto> {
    return prisma.order.delete({ where: { id } });
  }
}
