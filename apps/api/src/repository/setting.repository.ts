import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { ISettingRepository, SettingRow } from "./interfaces/isetting.repository";

export const settingSelect = {
  key: true,
  value: true,
  updatedAt: true,
} satisfies Prisma.SettingSelect;

export class SettingRepository implements ISettingRepository {
  async findAll(): Promise<SettingRow[]> {
    return prisma.setting.findMany({ select: settingSelect });
  }

  // One transaction so a multi-key save is all-or-nothing and the page can never read a half-written set.
  async upsertMany(entries: Record<string, string>): Promise<SettingRow[]> {
    const keys = Object.keys(entries);
    if (keys.length === 0) return this.findAll();

    await prisma.$transaction(
      keys.map((key) =>
        prisma.setting.upsert({
          where: { key },
          create: { key, value: entries[key] as string },
          update: { value: entries[key] as string },
          select: settingSelect,
        })
      )
    );

    return this.findAll();
  }
}
