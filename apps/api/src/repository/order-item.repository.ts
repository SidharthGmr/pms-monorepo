import prisma from "../config/prisma";

import { IOrderItemRepository } from "./interfaces/iorder-item.repository";
import { OrderItemDto, UpdateOrderItemDto } from '@pms/types';

export class OrderItemRepository implements IOrderItemRepository {
  async findByOrderId(orderId: number): Promise<OrderItemDto[]> {
    return prisma.orderItem.findMany({ where: { orderId } });
  }

  async findById(id: number): Promise<OrderItemDto | null> {
    return prisma.orderItem.findUnique({ where: { id } });
  }


  async update(id: number, data: UpdateOrderItemDto): Promise<OrderItemDto> {
    return prisma.orderItem.update({ where: { id }, data });
  }

  async delete(id: number): Promise<OrderItemDto> {
    return prisma.orderItem.delete({ where: { id } });
  }
}
