import { ContactMessageStatus } from "../enum/contact-message-status.enum";
import { PageFilterParams } from "./page.params";

export interface ContactMessageFilterParams extends PageFilterParams {
  /** Omitted means every status. */
  status?: ContactMessageStatus | null;
}
