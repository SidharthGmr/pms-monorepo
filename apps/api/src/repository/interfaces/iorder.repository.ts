import { CreateOrderModel } from "../../models/order.model";
import { OrderDto, UpdateOrderDto } from "../../dtos/order.dto";
import { OrderFilterParams } from "../../params/order.params";

export interface IOrderRepository {
  findAll(filters?: OrderFilterParams): Promise<OrderDto[]>;
  findByCustomerId(customerId: string): Promise<OrderDto[]>;
  findById(id: number): Promise<OrderDto | null>;
  update(id: number, data: UpdateOrderDto): Promise<OrderDto>;
  delete(id: number): Promise<OrderDto>;
}
