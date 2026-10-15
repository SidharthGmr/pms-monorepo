import { ContactMessageDto, ContactMessageFilterParams, CreateContactMessageModel, ListResponseDto } from "@pms/types";
import { ContactMessageStatus, Role } from "@prisma/client";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import NotFoundError from "../exceptions/not-found-error";
import { contactMessageSelect } from "../repository/contact-message.repository";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { notifyAdminOfContactMessage } from "../utils/email/contact-notification";
import logger from "../utils/logger";
@injectable()
export class ContactMessageService implements IContactMessageService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  async create(data: CreateContactMessageModel, storeCode?: string): Promise<ContactMessageDto> {
    const message = await this.unitOfWork.transaction(async (transactionClient) => {
      return transactionClient.contactMessage.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          subject: data.subject,
          message: data.message,
          ...(storeCode && { storeCode }),
        },
        select: contactMessageSelect,
      });
    });

    // Fired only after the write has committed, and never awaited: a mail hiccup must not be
    // able to fail the visitor's submission.
    void this.notifyAdmin(message);

    return message;
  }

  private async notifyAdmin(message: ContactMessageDto): Promise<void> {
    try {
      // The form is public, so there is no store inbox to lean on; an ADMIN user's address
      // stands in when ADMIN_NOTIFY_EMAIL is not configured.
      const admins = await this.unitOfWork.User.findAll({ role: Role.ADMIN, recordPerPage: 5 });
      const fallbackRecipient = (admins.data ?? []).find((admin) => !!admin.email)?.email ?? undefined;
      await notifyAdminOfContactMessage(message, fallbackRecipient);
    } catch (error) {
      logger.error('contact notification failed', { contactMessageId: message.id, error: (error as Error)?.message });
    }
  }

  async getAll(filters?: ContactMessageFilterParams): Promise<ListResponseDto<ContactMessageDto>> {
    return this.unitOfWork.ContactMessage.findAll(filters);
  }

  async getById(id: number): Promise<ContactMessageDto> {
    const message = await this.unitOfWork.ContactMessage.findById(id);
    if (!message) throw new NotFoundError("Contact message not found");
    return message;
  }

  async updateStatus(id: number, status: ContactMessageStatus): Promise<ContactMessageDto> {
    const existing = await this.unitOfWork.ContactMessage.findById(id);
    if (!existing) throw new NotFoundError("Contact message not found");
    if (existing.status === status) return existing;
    return this.unitOfWork.ContactMessage.updateStatus(id, status);
  }

  async delete(id: number): Promise<ContactMessageDto> {
    const existing = await this.unitOfWork.ContactMessage.findById(id);
    if (!existing) throw new NotFoundError("Contact message not found");
    return this.unitOfWork.ContactMessage.delete(id);
  }
}

import { IContactMessageService } from "./interfaces/Icontact-message.service";
