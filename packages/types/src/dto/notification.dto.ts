import { NotificationType } from "../enum/notification-type.enum";

export interface NotificationDto {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  /** In-app destination for the row, e.g. `/admin/orders`. Null when there is nowhere to go. */
  link: string | null;
  isRead: boolean;
  readAt: Date | string | null;
  /** The ids the row refers to (orderId, variantId, userId), for callers that want them. */
  metadata?: Record<string, unknown> | null;
  createdAt: Date | string;
}

export interface NotificationSummaryDto {
  unreadCount: number;
}

export interface MarkNotificationsReadResultDto {
  updated: number;
}
