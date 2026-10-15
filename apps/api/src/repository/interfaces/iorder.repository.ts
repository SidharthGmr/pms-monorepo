import { CreateOrderModel } from "../../models/order.model";
import { OrderDto, UpdateOrderDto } from "../../dtos/order.dto";
import { OrderStatus } from "@prisma/client";
import { OrderFilterParams } from "../../params/order.params";
import { ListResponseDto } from "@pms/types";

export interface IOrderRepository {
  findAll(filters?: OrderFilterParams): Promise<ListResponseDto<OrderDto>>;
  findByCustomerId(customerId: string): Promise<OrderDto[]>;
  findById(id: number): Promise<OrderDto | null>;
  update(id: number, data: UpdateOrderDto): Promise<OrderDto>;
  updateStatus(id: number, status: OrderStatus): Promise<OrderDto>;
  delete(id: number): Promise<OrderDto>;
}
