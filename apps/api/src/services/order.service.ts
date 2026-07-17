
import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { OrderDto, UpdateOrderDto } from "../dtos/order.dto";
import ClientError from "../exceptions/client-error";
import ForbiddenError from "../exceptions/forbidden-error";
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
      const orderItemsToCreate: { productId: number; quantity: number; unitPrice: number; totalPrice: number }[] = [];

      // Date the order is placed on — allows backdating; drives the price lookup.
      const orderDate = data.orderDate ? new Date(data.orderDate) : new Date();

      // Verify stock (derived from stockHistory) and resolve prices for each item.
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          const product = await transactionClient.product.findUnique({ where: { id: item.productId } });
          if (!product) {
            throw new NotFoundError(`Product with ID ${item.productId} not found`);
          }
          if (product.storeCode !== storeCode) {
            throw new ForbiddenError(`Product with ID ${item.productId} does not belong to your store`);
          }

          // Current on-hand stock = the sum of all stockHistory quantity movements.
          const stockAgg = await transactionClient.stockHistory.aggregate({
            where: { productId: item.productId },
            _sum: { quantity: true },
          });
          const availableStock = stockAgg._sum.quantity ?? 0;
          if (availableStock < item.quantity) {
            throw new ClientError(
              `Insufficient stock for product ${product.name}. Requested: ${item.quantity}, Available: ${availableStock}`
            );
          }

          // Resolve the price effective on the order date from the price-history
          // table. The client never sends a price — it is always resolved here.
          const priceRow = await this.unitOfWork.ProductPrice.getEffectiveOn(item.productId, orderDate, transactionClient);
          if (!priceRow) {
            throw new ClientError(`No price found for product ${product.name}. Please set a price before selling it.`);
          }
          const unitPrice = priceRow.sellingPrice;
          const totalPrice = unitPrice * item.quantity;
          calculatedTotalAmount += totalPrice;

          orderItemsToCreate.push({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice,
            totalPrice,
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
          storeCode,
          orderNumber,
          customerId: data.customerId,
          orderDate,
          totalAmount: calculatedTotalAmount,
          discount,
          tax,
          shippingCost,
          grandTotal,
          status: data.status || OrderStatus.PENDING,
          notes: data.notes || null,
          createdById,
          createdByName,
        },
      });

      // Create order items and deduct stock via negative stockHistory movements.
      for (const item of orderItemsToCreate) {
        await transactionClient.orderItem.create({
          data: {
            storeCode,
            orderId: order.id,
            orderNumber,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          },
        });

        await transactionClient.stockHistory.create({
          data: {
            productId: item.productId,
            storeCode,
            userId: createdById,
            quantity: -item.quantity,
            reason: `Order #${orderNumber}`,
          },
        });
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
