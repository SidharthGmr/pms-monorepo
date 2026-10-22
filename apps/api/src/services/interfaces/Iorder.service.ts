import { Prisma } from '@prisma/client';

import { OrderStatus } from "@prisma/client";


import { ListResponseDto, OrderDto, UpdateOrderDto, CreateOrderModel, OrderFilterParams } from '@pms/types';
export interface IOrderService {
  getAll(filters?: OrderFilterParams): Promise<ListResponseDto<OrderDto>>;
  getByCustomerId(customerId: string): Promise<OrderDto[]>;
  getById(id: number): Promise<OrderDto | null>;
  create(data: CreateOrderModel, storeCode: string, createdById: string, createdByName: string, tx?: Prisma.TransactionClient): Promise<OrderDto>;
  update(id: number, data: UpdateOrderDto, storeCode?: string): Promise<OrderDto>;
  updateStatus(id: number, status: OrderStatus, storeCode?: string): Promise<OrderDto>;
  delete(id: number, storeCode?: string): Promise<OrderDto>;
}
