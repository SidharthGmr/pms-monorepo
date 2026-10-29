import {
  EMAIL_TEMPLATE_DEFS,
  EmailTemplateDef,
  EmailTemplateDto,
  EmailTemplatePreviewDto,
  PreviewEmailTemplateModel,
  UpdateEmailTemplateModel,
} from "@pms/types";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import NotFoundError from "../exceptions/not-found-error";
import type { EmailTemplateOverride } from "../repository/interfaces/iemail-template.repository";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { dispatchEmailAsync, emailBrandDefaults } from "../utils/email/emailDispatcher.util";
import { fillPlaceholders, readTemplateSource, renderTemplateContent } from "../utils/templateRenderer";
import { IEmailTemplateService } from "./interfaces/Iemail-template.service";

@injectable()
export class EmailTemplateService implements IEmailTemplateService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) {}

  // The registry in @pms/types is the source of truth for which templates exist; the DB only
  // ever holds overrides, so an unknown key is a 404 regardless of what rows are present.
  private def(key: string): EmailTemplateDef {
    const def = EMAIL_TEMPLATE_DEFS.find((d) => d.key === key);
    if (!def) throw new NotFoundError("Email template not found");
    return def;
  }

  private async toDto(def: EmailTemplateDef, override: EmailTemplateOverride | null): Promise<EmailTemplateDto> {
    return {
      key: def.key,
      name: def.name,
      description: def.description,
      subject: override?.subject ?? def.defaultSubject,
      html: override?.html ?? (await readTemplateSource(def.key)),
      variables: def.variables,
      isCustomized: !!override,
      updatedAt: override?.updatedAt ?? null,
    };
  }

  async getAll(): Promise<EmailTemplateDto[]> {
    const overrides = await this.unitOfWork.EmailTemplate.findAll();
    const byKey = new Map(overrides.map((o) => [o.key, o]));
    return Promise.all(EMAIL_TEMPLATE_DEFS.map((def) => this.toDto(def, byKey.get(def.key) ?? null)));
  }

  async getByKey(key: string): Promise<EmailTemplateDto> {
    const def = this.def(key);
    const override = await this.unitOfWork.EmailTemplate.findByKey(key);
    return this.toDto(def, override);
  }

  async update(key: string, data: UpdateEmailTemplateModel): Promise<EmailTemplateDto> {
    const def = this.def(key);
    const override = await this.unitOfWork.EmailTemplate.upsert(key, data);
    return this.toDto(def, override);
  }

  async reset(key: string): Promise<EmailTemplateDto> {
    const def = this.def(key);
    await this.unitOfWork.EmailTemplate.deleteByKey(key);
    return this.toDto(def, null);
  }

  async preview(key: string, data: PreviewEmailTemplateModel): Promise<EmailTemplatePreviewDto> {
    const def = this.def(key);
    const variables = { ...(await emailBrandDefaults()), ...def.sampleData };
    return {
      subject: fillPlaceholders(data.subject, variables),
      html: await renderTemplateContent(key, data.html, variables),
    };
  }

  async sendTest(key: string, to: string, data: PreviewEmailTemplateModel): Promise<boolean> {
    const rendered = await this.preview(key, data);
    const result = await dispatchEmailAsync({ to, subject: `[Test] ${rendered.subject}`, html: rendered.html });
    return result !== null;
  }
}
