import { DEFAULT_INVOICE_TEMPLATE, SettingsDto, UpdateSettingsModel } from "@pms/types";
import { inject, injectable } from "inversify";
import env from "../config/env";
import { TYPES } from "../config/ioc.types";
import type { SettingRow } from "../repository/interfaces/isetting.repository";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { ISettingService } from "./interfaces/Isetting.service";

/** Keys the API recognises; anything else in the table is ignored rather than surfaced. */
const SETTING_KEYS = ["logoUrl", "siteName", "supportEmail", "invoiceTemplate"] as const;

@injectable()
export class SettingService implements ISettingService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) {}

  private toDto(rows: SettingRow[]): SettingsDto {
    const byKey = new Map(rows.map((row) => [row.key, row]));
    const latest = rows.reduce<Date | null>((newest, row) => (!newest || row.updatedAt > newest ? row.updatedAt : newest), null);

    return {
      logoUrl: byKey.get("logoUrl")?.value ?? "",
      siteName: byKey.get("siteName")?.value ?? env.APP_NAME,
      supportEmail: byKey.get("supportEmail")?.value ?? env.ADMIN_NOTIFY_EMAIL ?? "",
      invoiceTemplate: byKey.get("invoiceTemplate")?.value ?? DEFAULT_INVOICE_TEMPLATE,
      updatedAt: latest,
    };
  }

  async get(): Promise<SettingsDto> {
    return this.toDto(await this.unitOfWork.Setting.findAll());
  }

  async update(data: UpdateSettingsModel): Promise<SettingsDto> {
    // Only the keys the caller actually sent are written, so saving one tab leaves the rest alone.
    const entries: Record<string, string> = {};
    for (const key of SETTING_KEYS) {
      const value = data[key];
      if (value !== undefined) entries[key] = value;
    }

    return this.toDto(await this.unitOfWork.Setting.upsertMany(entries));
  }
}
