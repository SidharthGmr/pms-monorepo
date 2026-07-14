
import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { OrderDto, UpdateOrderDto } from "../dtos/order.dto";
import NotFoundError from "../exceptions/not-found-error";
import { CreateOrderModel } from "../models/order.model";
import { OrderFilterParams } from "../params/order.params";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { generateOrderNumber } from "../utils/authHelpers.service";
import { IOrderService } from "./interfaces/Iorder.service";
import { OrderStatus } from "@prisma/client";

@injectable()
export class OrderService implements IOrderService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  async getAll(filters?: OrderFilterParams): Promise<OrderDto[]> {
    return this.unitOfWork.Order.findAll(filters);
  }

  async getByCustomerId(customerId: string): Promise<OrderDto[]> {
    return this.unitOfWork.Order.findByCustomerId(customerId);
  }

  async getById(id: number): Promise<OrderDto | null> {
    const order = await this.unitOfWork.Order.findById(id);
    if (!order) throw new NotFoundError("Order not found");
    return order;
  }


  async create(data: CreateOrderModel, storeCode: string, createdById: string, createdByName: string): Promise<OrderDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      let calculatedTotalAmount = 0;
      const orderItemsToCreate = [];

      // Verify and deduct stock if items are provided
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          const product = await transactionClient.product.findUnique({
            where: { id: item.productId },
          });
          if (!product) {
            throw new Error(`Product with ID ${item.productId} not found`);
          }
          if (product.storeCode !== storeCode) {
            throw new Error(`Product with ID ${item.productId} does not belong to your store`);
          }
          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product ${product.name}. Requested: ${item.quantity}, Available: ${product.stock}`);
          }

          const unitPrice = product.price;
          const totalPrice = unitPrice * item.quantity;
          calculatedTotalAmount += totalPrice;

          orderItemsToCreate.push({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: unitPrice,
            totalPrice: totalPrice,
          });

          // Deduct stock
          await transactionClient.product.update({
            where: { id: item.productId },
            data: { stock: product.stock - item.quantity },
          });
        }
      }

      const orderNumber = generateOrderNumber();
      const discount = data.discount || 0;
      const tax = data.tax || 0;
      const shippingCost = data.shippingCost || 0;
      const grandTotal = calculatedTotalAmount + tax + shippingCost - discount;

      const order = await transactionClient.order.create({
        data: {
          storeCode: storeCode,
          orderNumber: orderNumber,
          customerId: data.customerId,
          orderDate: new Date(),
          totalAmount: calculatedTotalAmount,
          discount: discount,
          tax: tax,
          shippingCost: shippingCost,
          grandTotal: grandTotal,
          status: data.status || OrderStatus.PENDING,
          notes: data.notes || null,
          createdById: createdById,
          createdByName: createdByName,
        },
      });

      // Create Order Items
      if (orderItemsToCreate.length > 0) {
        for (const item of orderItemsToCreate) {
          await transactionClient.orderItem.create({
            data: {
              storeCode: storeCode,
              orderId: order.id,
              orderNumber: orderNumber,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            },
          });
        }
      }

      return order;
    }, { timeout: 15000 });
  }


  async update(id: number, data: UpdateOrderDto): Promise<OrderDto> {
    const existing = await this.unitOfWork.Order.findById(id);
    if (!existing) throw new NotFoundError("Order not found");
    return this.unitOfWork.Order.update(id, data);
  }

  async delete(id: number): Promise<OrderDto> {
    const existing = await this.unitOfWork.Order.findById(id);
    if (!existing) throw new NotFoundError("Order not found");
    return this.unitOfWork.Order.delete(id);
  }
}
