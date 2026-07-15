import { OrderDto, UpdateOrderDto } from "../../dtos/order.dto";
import { CreateOrderModel } from "../../models/order.model";
import { OrderFilterParams } from "../../params/order.params";

export interface IOrderService {
  getAll(filters?: OrderFilterParams): Promise<OrderDto[]>;
  getByCustomerId(customerId: string): Promise<OrderDto[]>;
  getById(id: number): Promise<OrderDto | null>;
  // create(data: CreateOrderModel, storeCode: string, createdById: string, createdByName: string): Promise<OrderDto>;
  update(id: number, data: UpdateOrderDto): Promise<OrderDto>;
  delete(id: number): Promise<OrderDto>;
}
