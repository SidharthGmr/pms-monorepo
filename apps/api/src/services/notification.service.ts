import { ListResponseDto, NotificationDto, NotificationFilterParams, NotificationTypeEnum } from "@pms/types";
import { OrderStatus, Role } from "@prisma/client";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { OrderDto } from "../dtos/order.dto";
import NotFoundError from "../exceptions/not-found-error";
import { CreateNotificationModel } from "../models/notification.model";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import logger from "../utils/logger";
import { INotificationService, LowStockNotice, UserRegisteredNotice } from "./interfaces/Inotification.service";

/**
 * In-app notifications. Every row belongs to exactly one recipient, so "tell the admins"
 * writes one row per admin and read state stays per person.
 *
 * The emit helpers never throw: they are called after a sale or a signup has already been
 * committed, and a failed notification must not undo or slow down the thing it reports.
 */

const STATUS_WORDING: Record<OrderStatus, string> = {
  PENDING: 'is awaiting confirmation',
  CONFIRMED: 'has been confirmed',
  SHIPPED: 'has been shipped',
  DELIVERED: 'has been delivered',
  CANCELLED: 'has been cancelled',
  RETURNED: 'has been returned',
};

const money = (value: number): string => value.toFixed(2);

@injectable()
export class NotificationService implements INotificationService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  async getAll(recipientId: string, filters?: NotificationFilterParams): Promise<ListResponseDto<NotificationDto>> {
    return this.unitOfWork.Notification.findAll(recipientId, filters);
  }

  async getUnreadCount(recipientId: string): Promise<number> {
    return this.unitOfWork.Notification.countUnread(recipientId);
  }

  async markRead(recipientId: string, ids?: number[]): Promise<number> {
    return this.unitOfWork.Notification.markRead(recipientId, ids);
  }

  async delete(id: number, recipientId: string): Promise<NotificationDto> {
    const deleted = await this.unitOfWork.Notification.delete(id, recipientId);
    if (!deleted) throw new NotFoundError("Notification not found");
    return deleted;
  }

  // Admins are looked up per emit rather than cached: a store gains and loses admins, and a
  // stale list would quietly stop notifying somebody.
  private async storeAdminIds(storeCode: string): Promise<string[]> {
    const admins = await this.unitOfWork.User.findAll({ storeCode, role: Role.ADMIN, showAllRecords: true });
    return (admins.data ?? []).map((admin) => admin.userId).filter((userId): userId is string => !!userId);
  }

  private async write(notifications: CreateNotificationModel[], context: Record<string, unknown>): Promise<void> {
    try {
      await this.unitOfWork.Notification.createMany(notifications);
    } catch (error) {
      logger.error('notification write failed', { ...context, error: (error as Error)?.message });
    }
  }

  async notifyUserRegistered(notice: UserRegisteredNotice): Promise<void> {
    try {
      const adminIds = (await this.storeAdminIds(notice.storeCode)).filter((id) => id !== notice.userId);
      if (adminIds.length === 0) return;

      await this.write(
        adminIds.map((recipientId) => ({
          storeCode: notice.storeCode,
          recipientId,
          type: NotificationTypeEnum.UserRegistered,
          title: 'New user in your store',
          message: `${notice.name} (${notice.email}) joined your store as ${notice.role.toLowerCase()}.`,
          link: '/admin/users/',
          metadata: { userId: notice.userId },
        })),
        { event: 'user-registered', userId: notice.userId }
      );
    } catch (error) {
      logger.error('user registered notification failed', { userId: notice.userId, error: (error as Error)?.message });
    }
  }

  async notifyOrderPlaced(order: OrderDto): Promise<void> {
    try {
      const adminIds = await this.storeAdminIds(order.storeCode);
      if (adminIds.length === 0) return;

      const itemCount = order.items?.length ?? 0;
      await this.write(
        adminIds.map((recipientId) => ({
          storeCode: order.storeCode,
          recipientId,
          type: NotificationTypeEnum.OrderPlaced,
          title: `New order ${order.orderNumber}`,
          message: `${itemCount} item${itemCount === 1 ? '' : 's'} totalling ${money(order.grandTotal)} is awaiting confirmation.`,
          link: '/admin/orders/',
          metadata: { orderId: order.id, orderNumber: order.orderNumber },
        })),
        { event: 'order-placed', orderId: order.id }
      );
    } catch (error) {
      logger.error('order placed notification failed', { orderId: order.id, error: (error as Error)?.message });
    }
  }

  // Both sides hear about a status move: the customer because it is their order, the admins
  // because whoever did not make the change still needs to see it.
  async notifyOrderStatusChanged(order: OrderDto, previousStatus: OrderStatus): Promise<void> {
    try {
      const wording = STATUS_WORDING[order.status] ?? `is now ${order.status.toLowerCase()}`;
      const adminIds = await this.storeAdminIds(order.storeCode);
      const recipients = [...new Set([order.customerId, ...adminIds])].filter(Boolean);
      if (recipients.length === 0) return;

      await this.write(
        recipients.map((recipientId) => ({
          storeCode: order.storeCode,
          recipientId,
          type: NotificationTypeEnum.OrderStatusChanged,
          title: `Order ${order.orderNumber} ${order.status.toLowerCase()}`,
          message:
            recipientId === order.customerId
              ? `Your order ${order.orderNumber} ${wording}.`
              : `Order ${order.orderNumber} moved from ${previousStatus.toLowerCase()} to ${order.status.toLowerCase()}.`,
          link: recipientId === order.customerId ? '/dashboard/orders/' : '/admin/orders/',
          metadata: { orderId: order.id, orderNumber: order.orderNumber, status: order.status, previousStatus },
        })),
        { event: 'order-status-changed', orderId: order.id }
      );
    } catch (error) {
      logger.error('order status notification failed', { orderId: order.id, error: (error as Error)?.message });
    }
  }

  // A variant sitting below its threshold would otherwise re-notify on every sale, so an admin
  // who has not yet read the open warning for that variant does not get a second one.
  async notifyLowStock(notice: LowStockNotice): Promise<void> {
    try {
      const adminIds = await this.storeAdminIds(notice.storeCode);
      if (adminIds.length === 0) return;

      const pending = await Promise.all(
        adminIds.map(async (recipientId) => {
          const alreadyWarned = await this.unitOfWork.Notification.hasUnread(recipientId, NotificationTypeEnum.LowStock, { variantId: notice.variantId });
          return alreadyWarned ? null : recipientId;
        })
      );

      const recipients = pending.filter((recipientId): recipientId is string => recipientId !== null);
      if (recipients.length === 0) return;

      const wording = notice.stock <= 0 ? 'is out of stock' : `is down to ${notice.stock} left`;
      await this.write(
        recipients.map((recipientId) => ({
          storeCode: notice.storeCode,
          recipientId,
          type: NotificationTypeEnum.LowStock,
          title: 'Low stock',
          message: `${notice.variantName} (${notice.sku}) ${wording}, at or below the threshold of ${notice.threshold}.`,
          link: '/admin/products/',
          metadata: { variantId: notice.variantId },
        })),
        { event: 'low-stock', variantId: notice.variantId }
      );
    } catch (error) {
      logger.error('low stock notification failed', { variantId: notice.variantId, error: (error as Error)?.message });
    }
  }
}
