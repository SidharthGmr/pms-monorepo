import { ContactMessageStatus } from "../enum/contact-message-status.enum";

export interface CreateContactMessageModel {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
}

export interface UpdateContactMessageStatusModel {
  status: ContactMessageStatus;
}
