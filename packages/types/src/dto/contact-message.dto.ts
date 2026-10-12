import { ContactMessageStatus } from "../enum/contact-message-status.enum";

export interface ContactMessageDto {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: Date | string;
  updatedAt: Date | string | null;
}
