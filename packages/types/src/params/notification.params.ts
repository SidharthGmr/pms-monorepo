import { NotificationType } from "../enum/notification-type.enum";
import { PageFilterParams } from "./page.params";

export interface NotificationFilterParams extends PageFilterParams {
  /** Omitted means every type. */
  type?: NotificationType | null;
  /** Omitted means read and unread alike. */
  isRead?: boolean | null;
}
