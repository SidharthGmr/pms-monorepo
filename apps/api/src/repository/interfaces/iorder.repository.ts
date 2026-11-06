

import { OrderStatus } from "@prisma/client";

import { ListResponseDto, OrderDto, UpdateOrderDto, OrderFilterParams } from '@pms/types';
export interface IOrderRepository {
  findAll(filters?: OrderFilterParams): Promise<ListResponseDto<OrderDto>>;
  findByCustomerId(customerId: string): Promise<OrderDto[]>;
  findById(id: number): Promise<OrderDto | null>;
  findByNumber(orderNumber: string): Promise<OrderDto | null>;
  findByPublicToken(publicToken: string): Promise<OrderDto | null>;
  /** Returns the existing token when one was already minted, so a link stays stable. */
  ensurePublicToken(id: number, token: string): Promise<string>;
  update(id: number, data: UpdateOrderDto): Promise<OrderDto>;
  updateStatus(id: number, status: OrderStatus): Promise<OrderDto>;
  delete(id: number): Promise<OrderDto>;
}
