import { CreateOrderModel } from "../../models/order.model";
import { OrderDto, UpdateOrderDto } from "../../dtos/order.dto";
import { OrderFilterParams } from "../../params/order.params";
import { ListResponseDto } from "../../dtos/list-response.dto";

export interface IOrderRepository {
  findAll(filters?: OrderFilterParams): Promise<ListResponseDto<OrderDto>>;
  findByCustomerId(customerId: string): Promise<OrderDto[]>;
  findById(id: number): Promise<OrderDto | null>;
  update(id: number, data: UpdateOrderDto): Promise<OrderDto>;
  delete(id: number): Promise<OrderDto>;
}
