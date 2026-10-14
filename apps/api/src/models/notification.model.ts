import { NotificationType } from "@pms/types";

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
