import { ListResponseDto, NotificationDto, NotificationFilterParams, OrderDto } from '@pms/types';
import { OrderStatus } from "@prisma/client";

export interface LowStockNotice {
  storeCode: string;
  variantId: number;
  variantName: string;
  sku: string;
  stock: number;
  threshold: number;
}

export interface UserRegisteredNotice {
  storeCode: string;
  userId: string;
  name: string;
  email: string;
  role: string;
}

export interface INotificationService {
  getAll(recipientId: string, filters?: NotificationFilterParams): Promise<ListResponseDto<NotificationDto>>;
  getUnreadCount(recipientId: string): Promise<number>;
  markRead(recipientId: string, ids?: number[]): Promise<number>;
  delete(id: number, recipientId: string): Promise<NotificationDto>;

  notifyUserRegistered(notice: UserRegisteredNotice): Promise<void>;
  notifyOrderPlaced(order: OrderDto): Promise<void>;
  notifyOrderStatusChanged(order: OrderDto, previousStatus: OrderStatus): Promise<void>;
  notifyLowStock(notice: LowStockNotice): Promise<void>;
}
