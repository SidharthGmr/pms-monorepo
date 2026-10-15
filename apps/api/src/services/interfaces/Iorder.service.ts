import { OrderDto, UpdateOrderDto } from "../../dtos/order.dto";
import { OrderStatus } from "@prisma/client";
import { CreateOrderModel } from "../../models/order.model";
import { OrderFilterParams } from "../../params/order.params";
import { ListResponseDto } from "@pms/types";

export interface IOrderService {
  getAll(filters?: OrderFilterParams): Promise<ListResponseDto<OrderDto>>;
  getByCustomerId(customerId: string): Promise<OrderDto[]>;
  getById(id: number): Promise<OrderDto | null>;
  create(data: CreateOrderModel, storeCode: string, createdById: string, createdByName: string): Promise<OrderDto>;
  update(id: number, data: UpdateOrderDto): Promise<OrderDto>;
  updateStatus(id: number, status: OrderStatus, storeCode?: string): Promise<OrderDto>;
  delete(id: number): Promise<OrderDto>;
}
