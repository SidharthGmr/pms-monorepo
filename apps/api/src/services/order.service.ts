
import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { OrderDto, UpdateOrderDto } from "../dtos/order.dto";
import { ListResponseDto } from "../dtos/list-response.dto";
import ClientError from "../exceptions/client-error";
import ForbiddenError from "../exceptions/forbidden-error";
import NotFoundError from "../exceptions/not-found-error";
import { CreateOrderModel } from "../models/order.model";
import { notifyAdminOfNewOrder } from "../utils/email/order-notification";
import logger from "../utils/logger";
import { OrderFilterParams } from "../params/order.params";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { generateOrderNumber } from "../utils/authHelpers.service";
import { payablePrice } from "../utils/variant-pricing";
import { IOrderService } from "./interfaces/Iorder.service";
import { OrderStatus, Role } from "@prisma/client";

@injectable()
export class OrderService implements IOrderService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  async getAll(filters?: OrderFilterParams): Promise<ListResponseDto<OrderDto>> {
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

  // Every read and write here is batched so the transaction runs a fixed handful of queries
  // however many lines the order has. The database is remote, and the earlier one-query-per-line
  // version timed out on carts of only a few items.
  async create(data: CreateOrderModel, storeCode: string, createdById: string, createdByName: string): Promise<OrderDto> {
    const order = await this.unitOfWork.transaction(async (transactionClient) => {
      const orderDate = data.orderDate ? new Date(data.orderDate) : new Date();
      const items = data.items ?? [];
      const variantIds = [...new Set(items.map((item) => item.variantId))];

      const orderItemsToCreate: { productId: number; variantId: number; quantity: number; unitPrice: number; totalPrice: number }[] = [];
      let calculatedTotalAmount = 0;

      if (items.length > 0) {
        const [variants, stockRows, prices] = await Promise.all([
          transactionClient.productVariant.findMany({
            where: { id: { in: variantIds } },
            include: { product: { select: { name: true } } },
          }),
          transactionClient.stockHistory.groupBy({
            by: ['variantId'],
            where: { variantId: { in: variantIds } },
            _sum: { quantity: true },
          }),
          this.unitOfWork.PriceHistory.getEffectiveOnMany(variantIds, orderDate, transactionClient),
        ]);

        const variantById = new Map(variants.map((variant) => [variant.id, variant] as const));
        const stockByVariant = new Map(stockRows.map((row) => [row.variantId as number, row._sum.quantity ?? 0] as const));

        // Two lines for the same variant compete for the same stock, so the check is on the summed request.
        const requestedByVariant = new Map<number, number>();
        for (const item of items) requestedByVariant.set(item.variantId, (requestedByVariant.get(item.variantId) ?? 0) + item.quantity);

        for (const item of items) {
          const variant = variantById.get(item.variantId);
          if (!variant || variant.deletedAt) {
            throw new NotFoundError(`Product variant with ID ${item.variantId} not found`);
          }
          if (variant.storeCode !== storeCode) {
            throw new ForbiddenError(`Product variant with ID ${item.variantId} does not belong to your store`);
          }

          const label = `${variant.product.name}${variant.sku ? ` (${variant.sku})` : ''}`;
          const availableStock = stockByVariant.get(item.variantId) ?? 0;
          const requested = requestedByVariant.get(item.variantId) ?? item.quantity;
          if (availableStock < requested) {
            throw new ClientError(`Insufficient stock for ${label}. Requested: ${requested}, Available: ${availableStock}`);
          }

          const priceRow = prices.get(item.variantId);
          if (!priceRow) {
            throw new ClientError(`No price found for ${label}. Please set a price before selling it.`);
          }
          const unitPrice = payablePrice(
            {
              effectiveFrom: priceRow.effectiveFrom,
              effectiveTo: priceRow.effectiveTo,
              sellingPrice: priceRow.sellingPrice,
              offerPrice: priceRow.offerPrice,
              costPrice: priceRow.costPrice,
              compareAtPrice: priceRow.compareAtPrice,
            },
            variant.isOffer
          ) as number;
          const totalPrice = unitPrice * item.quantity;
          calculatedTotalAmount += totalPrice;

          orderItemsToCreate.push({ productId: variant.productId, variantId: item.variantId, quantity: item.quantity, unitPrice, totalPrice });
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

      if (orderItemsToCreate.length > 0) {
        await transactionClient.orderItem.createMany({
          data: orderItemsToCreate.map((item) => ({
            storeCode,
            orderId: order.id,
            orderNumber,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        });

        await transactionClient.stockHistory.createMany({
          data: orderItemsToCreate.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            storeCode,
            createdById,
            quantity: -item.quantity,
            reason: `Order #${orderNumber}`,
          })),
        });
      }

      return order;
    });

    // Fired only after the transaction has committed, and never awaited: the admin's copy of
    // the order must not be able to slow a sale down or roll one back.
    void this.notifyAdmin(order.id);

    return order;
  }

  private async notifyAdmin(orderId: number): Promise<void> {
    try {
      const order = await this.unitOfWork.Order.findById(orderId);
      if (!order) return;

      // Stores rarely have their own inbox on file, so the store's admin user stands in for it.
      let fallbackRecipient: string | undefined;
      if (!(order as { store?: { email?: string | null } }).store?.email) {
        const admins = await this.unitOfWork.User.findAll({ storeCode: order.storeCode, role: Role.ADMIN, recordPerPage: 5 });
        fallbackRecipient = (admins.data ?? []).find((admin) => !!admin.email)?.email ?? undefined;
      }

      await notifyAdminOfNewOrder(order, fallbackRecipient);
    } catch (error) {
      logger.error('order notification failed', { orderId, error: (error as Error)?.message });
    }
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
