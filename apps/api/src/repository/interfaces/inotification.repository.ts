import { ListResponseDto, NotificationDto, NotificationFilterParams, NotificationType } from "@pms/types";
import { CreateNotificationModel } from "../../models/notification.model";

export interface INotificationRepository {
  createMany(notifications: CreateNotificationModel[]): Promise<number>;
  findAll(recipientId: string, filters?: NotificationFilterParams): Promise<ListResponseDto<NotificationDto>>;
  countUnread(recipientId: string): Promise<number>;
  /** Scoped to the recipient, so one caller can never mark another's rows. */
  markRead(recipientId: string, ids?: number[]): Promise<number>;
  delete(id: number, recipientId: string): Promise<NotificationDto | null>;
  /** Used to keep a repeating condition (a variant still below its threshold) to one open row. */
  hasUnread(recipientId: string, type: NotificationType, metadataMatch: Record<string, unknown>): Promise<boolean>;
}
