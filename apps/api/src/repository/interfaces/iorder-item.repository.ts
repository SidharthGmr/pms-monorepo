import { OrderItemDto, UpdateOrderItemDto } from '@pms/types';

export interface IOrderItemRepository {
  findByOrderId(orderId: number): Promise<OrderItemDto[]>;
  findById(id: number): Promise<OrderItemDto | null>;
  update(id: number, data: UpdateOrderItemDto): Promise<OrderItemDto>;
  delete(id: number): Promise<OrderItemDto>;
}
