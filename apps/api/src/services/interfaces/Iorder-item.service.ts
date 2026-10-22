import { OrderItemDto, UpdateOrderItemDto, CreateOrderItemModel } from '@pms/types';


export interface IOrderItemService {
  getByOrderId(orderId: number): Promise<OrderItemDto[]>;
  getById(id: number): Promise<OrderItemDto | null>;
  create(data: CreateOrderItemModel, storeCode: string): Promise<OrderItemDto>;
  update(id: number, data: UpdateOrderItemDto): Promise<OrderItemDto>;
  delete(id: number): Promise<OrderItemDto>;
}
