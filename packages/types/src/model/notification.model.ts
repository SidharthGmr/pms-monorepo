export interface MarkNotificationsReadModel {
  /** The rows to mark. Omit to mark every unread notification the caller owns. */
  ids?: number[];
}
