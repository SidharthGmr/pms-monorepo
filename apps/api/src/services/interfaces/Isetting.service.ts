import { SettingsDto, UpdateSettingsModel } from "@pms/types";

export interface ISettingService {
  get(): Promise<SettingsDto>;
  update(data: UpdateSettingsModel): Promise<SettingsDto>;
}
