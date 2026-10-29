import { EmailTemplateDto, EmailTemplatePreviewDto, PreviewEmailTemplateModel, UpdateEmailTemplateModel } from "@pms/types";

export interface IEmailTemplateService {
  getAll(): Promise<EmailTemplateDto[]>;
  getByKey(key: string): Promise<EmailTemplateDto>;
  update(key: string, data: UpdateEmailTemplateModel): Promise<EmailTemplateDto>;
  reset(key: string): Promise<EmailTemplateDto>;
  preview(key: string, data: PreviewEmailTemplateModel): Promise<EmailTemplatePreviewDto>;
  sendTest(key: string, to: string, data: PreviewEmailTemplateModel): Promise<boolean>;
}
