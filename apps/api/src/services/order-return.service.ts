import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';

import {
  ListResponseDto,
  OrderReturnDto,
  OrderReturnFilterParams,
  OrderReturnModel,
  OrderReturnStatusModel,
  ReturnedQuantityDto,
  ReturnItemConditionEnum,
  ReturnStatusEnum,
  ReturnTypeEnum,
} from '@pms/types';
import { OrderStatus, Prisma, ReturnItemCondition, ReturnStatus, Role } from '@prisma/client';

import ClientError from '../exceptions/client-error';
import ForbiddenError from '../exceptions/forbidden-error';
import NotFoundError from '../exceptions/not-found-error';

import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { notifyAdminOfReturn, notifyCustomerOfReturnStatus } from '../utils/email/return-notification';
import logger from '../utils/logger';
import { ACTIVE_RETURN_STATUSES, orderReturnSelect } from '../repository/order-return.repository';
import { IOrderReturnService } from './interfaces/Iorder-return.service';
import { IOrderService } from './interfaces/Iorder.service';

const generateReturnNumber = () => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RET-${yyyy}${mm}${dd}-${random}`;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  REQUESTED: [ReturnStatus.APPROVED, ReturnStatus.REJECTED, ReturnStatus.CANCELLED],
  APPROVED: [ReturnStatus.RECEIVED, ReturnStatus.CANCELLED],
  RECEIVED: [ReturnStatus.COMPLETED],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

// Approving, rejecting and paying out are decisions; taking goods back over the counter is not.
const ADMIN_ONLY_TARGETS: ReturnStatus[] = [ReturnStatus.APPROVED, ReturnStatus.REJECTED, ReturnStatus.COMPLETED];

type ReturnLine = {
  orderItemId: number;
  productId: number;
  variantId: number;
  storeCode: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  condition: ReturnItemCondition;
};

@injectable()
export class OrderReturnService implements IOrderReturnService {
  constructor(
    @inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork,
    @inject(TYPES.IOrderService) private orderService: IOrderService
  ) {}

  async create(data: OrderReturnModel, storeCode: string, userId: string, userName: string, isAdmin: boolean): Promise<OrderReturnDto> {
    const order = await this.unitOfWork.Order.findById(data.orderId);
    if (!order) throw new NotFoundError('Order not found');
    if (order.storeCode !== storeCode) throw new ForbiddenError('This order belongs to another store');
    if (order.status !== OrderStatus.DELIVERED) throw new ClientError('Only delivered orders can be returned or exchanged');

    const returnNumber = generateReturnNumber();

    const orderReturnData = await this.unitOfWork.transaction(async (transactionClient) => {
      const store = await transactionClient.store.findUnique({ where: { code: storeCode }, select: { returnWindowDays: true } });
      const windowDays = store?.returnWindowDays ?? 3;
      const anchor = new Date((order.deliveredAt ?? order.orderDate) as Date | string);
      const deadline = new Date(anchor.getTime() + windowDays * DAY_MS);
      if (new Date() > deadline && !(data.overrideWindow && isAdmin)) {
        throw new ClientError(`The ${windowDays}-day return window for this order closed on ${deadline.toDateString()}. An admin can override it.`);
      }

      const { lines, returnValue } = await this.buildLines(transactionClient, order.id, storeCode, data.items);

      let refundAmount = returnValue;
      let exchangeOrderId: number | null = null;

      // An exchange is a real replacement sale: the existing order pipeline prices the lines,
      // locks and decrements stock, and the return credit lands as a discount on it, so the
      // order's grand total is exactly what the customer still owes at the counter.
      if (data.type === ReturnTypeEnum.Exchange) {
        const exchangeOrder = await this.orderService.create(
          {
            customerId: order.customerId,
            status: OrderStatus.CONFIRMED,
            notes: `Exchange for return ${returnNumber} (order ${order.orderNumber})`,
            items: data.exchangeItems ?? [],
          },
          storeCode,
          userId,
          userName,
          transactionClient
        );
        const credit = Math.min(returnValue, exchangeOrder.grandTotal);
        if (credit > 0) {
          await transactionClient.order.update({
            where: { id: exchangeOrder.id },
            data: { discount: exchangeOrder.discount + credit, grandTotal: exchangeOrder.grandTotal - credit },
          });
        }
        refundAmount = returnValue - credit;
        exchangeOrderId = exchangeOrder.id;
      }

      const alreadyRefunded = await this.sumActiveRefund(transactionClient, order.id);
      if (refundAmount > order.grandTotal - alreadyRefunded) {
        throw new ClientError('The refund would exceed what was charged for this order');
      }

      return transactionClient.orderReturn.create({
        data: {
          returnNumber,
          orderId: order.id,
          storeCode,
          customerId: order.customerId,
          type: data.type,
          reason: data.reason,
          notes: data.notes ?? null,
          refundAmount,
          refundMethod: data.refundMethod ?? null,
          exchangeOrderId,
          requestedById: userId,
          items: { createMany: { data: lines } },
        },
        select: orderReturnSelect,
      });
    });

    // Fired only after the transaction has committed, and never awaited: the counter must not
    // wait on SMTP, and a mail failure must not roll the return back.
    void this.mailStore(orderReturnData);

    return orderReturnData;
  }

  async getAll(filters?: OrderReturnFilterParams): Promise<ListResponseDto<OrderReturnDto>> {
    return this.unitOfWork.OrderReturn.findAll(filters);
  }

  async getById(id: number, storeCode: string): Promise<OrderReturnDto> {
    const orderReturn = await this.unitOfWork.OrderReturn.findById(id);
    if (!orderReturn) throw new NotFoundError('Return not found');
    if (orderReturn.storeCode !== storeCode) throw new ForbiddenError('This return belongs to another store');
    return orderReturn;
  }

  async update(id: number, data: OrderReturnModel, storeCode: string, isAdmin: boolean): Promise<OrderReturnDto> {
    const existing = await this.getById(id, storeCode);
    if (existing.status !== ReturnStatusEnum.Requested) throw new ClientError('Only a requested return can still be edited');
    if (data.type !== existing.type) throw new ClientError('A return cannot change type - cancel it and create a new one');
    if (existing.type === ReturnTypeEnum.Exchange) {
      // Its exchange order already exists, priced and stock-adjusted; reworking the lines here
      // would mean silently rebuilding that order too. Cancel and recreate instead.
      const orderReturnData = await this.unitOfWork.transaction(async (transactionClient) => {
        return transactionClient.orderReturn.update({
          where: { id },
          data: { reason: data.reason, notes: data.notes ?? null, updatedAt: new Date() },
          select: orderReturnSelect,
        });
      });
      return orderReturnData;
    }

    const orderReturnData = await this.unitOfWork.transaction(async (transactionClient) => {
      const { lines, returnValue } = await this.buildLines(transactionClient, existing.orderId, storeCode, data.items, id);

      const order = await transactionClient.order.findUnique({ where: { id: existing.orderId }, select: { grandTotal: true } });
      const alreadyRefunded = await this.sumActiveRefund(transactionClient, existing.orderId, id);
      if (returnValue > (order?.grandTotal ?? 0) - alreadyRefunded) {
        throw new ClientError('The refund would exceed what was charged for this order');
      }

      await transactionClient.orderReturnItem.deleteMany({ where: { returnId: id } });
      return transactionClient.orderReturn.update({
        where: { id },
        data: {
          reason: data.reason,
          notes: data.notes ?? null,
          refundAmount: returnValue,
          refundMethod: data.refundMethod ?? null,
          items: { createMany: { data: lines } },
          updatedAt: new Date(),
        },
        select: orderReturnSelect,
      });
    });

    return orderReturnData;
  }

  async delete(id: number, storeCode: string): Promise<OrderReturnDto> {
    const existing = await this.getById(id, storeCode);
    if (existing.status !== ReturnStatusEnum.Requested) throw new ClientError('Only a requested return can be deleted - cancel it instead');
    if (existing.type === ReturnTypeEnum.Exchange) {
      throw new ClientError('An exchange carries a replacement order, so it must be cancelled, not deleted');
    }
    const orderReturnData = await this.unitOfWork.transaction(async (transactionClient) => {
      return transactionClient.orderReturn.delete({ where: { id }, select: orderReturnSelect });
    });
    return orderReturnData;
  }

  async updateStatus(id: number, data: OrderReturnStatusModel, storeCode: string, userId: string, isAdmin: boolean): Promise<OrderReturnDto> {
    const existing = await this.getById(id, storeCode);
    const target = data.status as ReturnStatus;
    if (existing.status === target) return existing;

    if (!TRANSITIONS[existing.status as ReturnStatus].includes(target)) {
      throw new ClientError(`A ${existing.status.toLowerCase()} return cannot move to ${target.toLowerCase()}`);
    }
    if (ADMIN_ONLY_TARGETS.includes(target) && !isAdmin) {
      throw new ForbiddenError('Only an admin can approve, reject or complete a return');
    }

    const refundMethod = data.refundMethod ?? existing.refundMethod ?? null;
    if (target === ReturnStatus.COMPLETED && existing.refundAmount > 0 && !refundMethod) {
      throw new ClientError('Pick how the refund is paid out before completing the return');
    }

    const orderReturnData = await this.unitOfWork.transaction(async (transactionClient) => {
      // Goods physically back over the counter: the sellable units rejoin the stock ledger the
      // same way the sale removed them. DAMAGED lines are deliberately never restocked.
      if (target === ReturnStatus.RECEIVED) {
        const sellable = (existing.items ?? []).filter((item) => item.condition === ReturnItemConditionEnum.Sellable);
        if (sellable.length > 0) {
          await transactionClient.stockHistory.createMany({
            data: sellable.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              storeCode,
              createdById: userId,
              quantity: item.quantity,
              reason: `Return #${existing.returnNumber}`,
            })),
          });
        }
      }

      // A rejected or cancelled exchange voids its replacement order and hands that stock back,
      // inline rather than through OrderService.updateStatus, which opens its own transaction.
      if ((target === ReturnStatus.REJECTED || target === ReturnStatus.CANCELLED) && existing.exchangeOrderId) {
        const exchangeOrder = await transactionClient.order.findUnique({ where: { id: existing.exchangeOrderId }, include: { items: true } });
        if (exchangeOrder && exchangeOrder.status !== OrderStatus.CANCELLED) {
          if (exchangeOrder.items.length > 0) {
            await transactionClient.stockHistory.createMany({
              data: exchangeOrder.items.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                storeCode,
                createdById: userId,
                quantity: item.quantity,
                reason: `Order #${exchangeOrder.orderNumber} cancelled with return ${existing.returnNumber}`,
              })),
            });
          }
          await transactionClient.order.update({ where: { id: exchangeOrder.id }, data: { status: OrderStatus.CANCELLED } });
        }
      }

      const resolved = target === ReturnStatus.COMPLETED || target === ReturnStatus.REJECTED || target === ReturnStatus.CANCELLED;
      return transactionClient.orderReturn.update({
        where: { id },
        data: {
          status: target,
          notes: data.notes ?? existing.notes ?? null,
          refundMethod,
          refundTransactionId: data.refundTransactionId ?? existing.refundTransactionId ?? null,
          processedById: userId,
          resolvedAt: resolved ? new Date() : null,
          updatedAt: new Date(),
        },
        select: orderReturnSelect,
      });
    });

    void this.mailCustomer(orderReturnData);

    return orderReturnData;
  }

  async getReturnedQuantities(orderId: number, storeCode: string): Promise<ReturnedQuantityDto[]> {
    const order = await this.unitOfWork.Order.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    if (order.storeCode !== storeCode) throw new ForbiddenError('This order belongs to another store');
    return this.unitOfWork.OrderReturn.sumActiveByOrderItem(orderId);
  }

  async getByCustomerId(customerId: string): Promise<OrderReturnDto[]> {
    return this.unitOfWork.OrderReturn.findByCustomerId(customerId);
  }

  // Stores rarely have their own inbox on file, so the store's admin user stands in for it -
  // the same fallback chain a new order's notification uses.
  private async mailStore(orderReturn: OrderReturnDto): Promise<void> {
    try {
      const store = await this.unitOfWork.Store.getByCode(orderReturn.storeCode);
      let fallbackRecipient: string | undefined;
      if (!store?.email) {
        const admins = await this.unitOfWork.User.findAll({ storeCode: orderReturn.storeCode, role: Role.ADMIN, recordPerPage: 5 });
        fallbackRecipient = (admins.data ?? []).find((admin) => !!admin.email)?.email ?? undefined;
      }
      await notifyAdminOfReturn(orderReturn, store?.name ?? orderReturn.storeCode, store?.email, fallbackRecipient);
    } catch (error) {
      logger.error('return store notification failed', { returnNumber: orderReturn.returnNumber, error: (error as Error)?.message });
    }
  }

  private async mailCustomer(orderReturn: OrderReturnDto): Promise<void> {
    try {
      const store = await this.unitOfWork.Store.getByCode(orderReturn.storeCode);
      await notifyCustomerOfReturnStatus(orderReturn, store?.name ?? orderReturn.storeCode);
    } catch (error) {
      logger.error('return customer notification failed', { returnNumber: orderReturn.returnNumber, error: (error as Error)?.message });
    }
  }

  // Prices come from the sold lines, never the request: what was paid is what comes back.
  // Re-read inside the caller's transaction so two concurrent returns cannot both claim the
  // last returnable unit of a line.
  private async buildLines(
    transactionClient: Prisma.TransactionClient,
    orderId: number,
    storeCode: string,
    items: OrderReturnModel['items'],
    excludeReturnId?: number
  ): Promise<{ lines: ReturnLine[]; returnValue: number }> {
    const seen = new Set<number>();
    for (const line of items) {
      if (seen.has(line.orderItemId)) throw new ClientError('The same order line appears twice in the request');
      seen.add(line.orderItemId);
    }

    const [orderItems, returnedRows] = await Promise.all([
      transactionClient.orderItem.findMany({ where: { orderId }, include: { variant: { select: { name: true, sku: true } } } }),
      transactionClient.orderReturnItem.groupBy({
        by: ['orderItemId'],
        where: {
          return: {
            orderId,
            status: { in: ACTIVE_RETURN_STATUSES },
            ...(excludeReturnId !== undefined && { id: { not: excludeReturnId } }),
          },
        },
        _sum: { quantity: true },
      }),
    ]);

    const soldById = new Map(orderItems.map((item) => [item.id, item] as const));
    const returnedById = new Map(returnedRows.map((row) => [row.orderItemId, row._sum.quantity ?? 0] as const));

    const lines: ReturnLine[] = [];
    let returnValue = 0;
    for (const line of items) {
      const sold = soldById.get(line.orderItemId);
      if (!sold) throw new NotFoundError(`Order line ${line.orderItemId} does not belong to this order`);
      const remaining = sold.quantity - (returnedById.get(line.orderItemId) ?? 0);
      if (line.quantity > remaining) {
        const label = `${sold.variant.name}${sold.variant.sku ? ` (${sold.variant.sku})` : ''}`;
        throw new ClientError(`Only ${remaining} unit(s) of ${label} can still be returned`);
      }
      const amount = sold.unitPrice * line.quantity;
      returnValue += amount;
      lines.push({
        orderItemId: line.orderItemId,
        productId: sold.productId,
        variantId: sold.variantId,
        storeCode,
        quantity: line.quantity,
        unitPrice: sold.unitPrice,
        amount,
        condition: (line.condition ?? ReturnItemConditionEnum.Sellable) as ReturnItemCondition,
      });
    }

    return { lines, returnValue };
  }

  private async sumActiveRefund(transactionClient: Prisma.TransactionClient, orderId: number, excludeReturnId?: number): Promise<number> {
    const row = await transactionClient.orderReturn.aggregate({
      where: {
        orderId,
        status: { in: ACTIVE_RETURN_STATUSES },
        ...(excludeReturnId !== undefined && { id: { not: excludeReturnId } }),
      },
      _sum: { refundAmount: true },
    });
    return row._sum.refundAmount ?? 0;
  }
}
