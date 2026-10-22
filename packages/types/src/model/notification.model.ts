import { NotificationType } from "../enum/notification-type.enum";

export interface MarkNotificationsReadModel {
  /** The rows to mark. Omit to mark every unread notification the caller owns. */
  ids?: number[];
}

/** What the emit helpers hand the repository. Rows are server-written, so this is internal. */
export interface CreateNotificationModel {
  storeCode: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
}
