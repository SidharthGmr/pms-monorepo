import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { OrderItemDto, UpdateOrderItemDto } from "../dtos/order-item.dto";
import NotFoundError from "../exceptions/not-found-error";
import { CreateOrderItemModel } from "../models/order-item.model";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { IOrderItemService } from "./interfaces/Iorder-item.service";

@injectable()
export class OrderItemService implements IOrderItemService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  async getByOrderId(orderId: number): Promise<OrderItemDto[]> {
    return this.unitOfWork.OrderItem.findByOrderId(orderId);
  }

  async getById(id: number): Promise<OrderItemDto | null> {
    const item = await this.unitOfWork.OrderItem.findById(id);
    if (!item) throw new NotFoundError("Order item not found");
    return item;
  }


  async create(data: CreateOrderItemModel, storeCode: string): Promise<OrderItemDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      const orderItem = await transactionClient.orderItem.create({
        data: {
          storeCode: storeCode,
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          productId: data.productId,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          totalPrice: data.totalPrice
        },
      });
      return orderItem;
    });
  }



  async update(id: number, data: UpdateOrderItemDto): Promise<OrderItemDto> {
    const existing = await this.unitOfWork.OrderItem.findById(id);
    if (!existing) throw new NotFoundError("Order item not found");
    return this.unitOfWork.OrderItem.update(id, data);
  }

  async delete(id: number): Promise<OrderItemDto> {
    const existing = await this.unitOfWork.OrderItem.findById(id);
    if (!existing) throw new NotFoundError("Order item not found");
    return this.unitOfWork.OrderItem.delete(id);
  }
}
