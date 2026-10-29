import { UpdateEmailTemplateModel } from "@pms/types";

/** The DB rows are overrides only - the merge with file defaults happens in the service. */
export interface EmailTemplateOverride {
  key: string;
  subject: string;
  html: string;
  updatedAt: Date;
}

export interface IEmailTemplateRepository {
  findAll(): Promise<EmailTemplateOverride[]>;
  findByKey(key: string): Promise<EmailTemplateOverride | null>;
  upsert(key: string, data: UpdateEmailTemplateModel): Promise<EmailTemplateOverride>;
  deleteByKey(key: string): Promise<void>;
}
