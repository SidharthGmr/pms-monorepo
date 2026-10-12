import { PageFilterParams } from "./page.params";

export interface SubscriberFilterParams extends PageFilterParams {
  /** true keeps only live subscriptions, false only opted-out ones; omitted means both. */
  active?: boolean;
}
