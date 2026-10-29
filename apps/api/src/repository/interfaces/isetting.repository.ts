export interface SettingRow {
  key: string;
  value: string;
  updatedAt: Date;
}

export interface ISettingRepository {
  findAll(): Promise<SettingRow[]>;
  upsertMany(entries: Record<string, string>): Promise<SettingRow[]>;
}
