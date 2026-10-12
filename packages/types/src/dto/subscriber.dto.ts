export interface SubscriberDto {
  id: number;
  email: string;
  createdAt: Date | string;
  /** Null while the subscription is live; set when the address opts out. */
  unsubscribedAt: Date | string | null;
}
