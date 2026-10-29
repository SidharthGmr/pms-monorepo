import { UpdateEmailTemplateModel } from "@pms/types";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { EmailTemplateOverride, IEmailTemplateRepository } from "./interfaces/iemail-template.repository";

export const emailTemplateSelect = {
  key: true,
  subject: true,
  html: true,
  updatedAt: true,
} satisfies Prisma.EmailTemplateSelect;

export class EmailTemplateRepository implements IEmailTemplateRepository {
  async findAll(): Promise<EmailTemplateOverride[]> {
    return prisma.emailTemplate.findMany({ select: emailTemplateSelect });
  }

  async findByKey(key: string): Promise<EmailTemplateOverride | null> {
    return prisma.emailTemplate.findUnique({ where: { key }, select: emailTemplateSelect });
  }

  async upsert(key: string, data: UpdateEmailTemplateModel): Promise<EmailTemplateOverride> {
    return prisma.emailTemplate.upsert({
      where: { key },
      create: { key, subject: data.subject, html: data.html },
      update: { subject: data.subject, html: data.html },
      select: emailTemplateSelect,
    });
  }

  async deleteByKey(key: string): Promise<void> {
    // deleteMany so resetting a template that was never customised is a no-op, not a P2025.
    await prisma.emailTemplate.deleteMany({ where: { key } });
  }
}
