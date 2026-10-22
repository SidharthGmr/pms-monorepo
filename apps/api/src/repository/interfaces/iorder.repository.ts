

import { OrderStatus } from "@prisma/client";

import { ListResponseDto, OrderDto, UpdateOrderDto, OrderFilterParams } from '@pms/types';
export interface IOrderRepository {
  findAll(filters?: OrderFilterParams): Promise<ListResponseDto<OrderDto>>;
  findByCustomerId(customerId: string): Promise<OrderDto[]>;
  findById(id: number): Promise<OrderDto | null>;
  update(id: number, data: UpdateOrderDto): Promise<OrderDto>;
  updateStatus(id: number, status: OrderStatus): Promise<OrderDto>;
  delete(id: number): Promise<OrderDto>;
}
