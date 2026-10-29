import { Status } from "@prisma/client";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { ListResponseDto, CreateMasterEntryDto, UpdateMasterEntryDto, MasterEntryDto, MasterEntryFilterParams } from '@pms/types';
import ForbiddenError from "../exceptions/forbidden-error";
import NotFoundError from "../exceptions/not-found-error";
import CustomError from "../exceptions/custom-error";

import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { IMasterEntryService } from "./interfaces/Imaster-entry.service";

@injectable()
export class MasterEntryService implements IMasterEntryService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  async getAll(filters?: MasterEntryFilterParams): Promise<ListResponseDto<MasterEntryDto>> {
    return this.unitOfWork.MasterEntry.findAll(filters);
  }

  async getById(id: number): Promise<MasterEntryDto | null> {
    const entry = await this.unitOfWork.MasterEntry.findById(id);
    if (!entry) throw new NotFoundError("Master entry not found");
    return entry;
  }

  // One call files several values under the same attribute: each becomes its own row, and the
  // whole batch shares a transaction so a duplicate part way through rolls the rest back rather
  // than leaving half a list behind. Blank and repeated values are dropped before writing, since
  // (attributeId, value) is unique and a repeat would only ever be a typo in the form.
  async create(data: CreateMasterEntryDto, storeCode: string): Promise<MasterEntryDto[]> {
    // An entry inherits its store from its parent group, so a value can never be
    // filed under a store the attribute does not belong to.
    const attribute = await this.unitOfWork.MasterAttribute.findById(data.attributeId);
    if (!attribute) throw new NotFoundError("Master attribute not found");
    if (attribute.storeCode !== storeCode) throw new ForbiddenError("Master attribute does not belong to your store");

    const values = [...new Set((data.values ?? []).map((value) => value.trim()).filter((value) => value.length > 0))];
    if (values.length === 0) throw new CustomError("Add at least one value", 400);

    return this.unitOfWork.transaction(async (transactionClient) => {
      const entries: MasterEntryDto[] = [];

      for (const [index, value] of values.entries()) {
        const created = await transactionClient.masterEntry.create({
          data: {
            attributeId: data.attributeId,
            // The label defaults to the value: the form no longer collects one separately.
            name: data.name ?? value,
            value,
            colorHex: data.colorHex || null,
            ...(data.metadata !== undefined && data.metadata !== null && { metadata: data.metadata }),
            storeCode: attribute.storeCode,
            status: data.status ?? Status.Published,
            // Successive values keep the order they were typed in.
            displayOrder: data.displayOrder !== undefined && data.displayOrder !== null ? data.displayOrder + index : null,
          },
          select: { id: true },
        });

        // Read back through the transaction client - the global one cannot see this row yet.
        const entry = await this.unitOfWork.MasterEntry.findById(created.id, transactionClient);
        if (!entry) throw new NotFoundError("Master entry not found");
        entries.push(entry);
      }

      return entries;
    });
  }

  async update(id: number, data: UpdateMasterEntryDto): Promise<MasterEntryDto> {
    const existing = await this.unitOfWork.MasterEntry.findById(id);
    if (!existing) throw new NotFoundError("Master entry not found");

    // Moving an entry to another group must not move it across stores.
    if (data.attributeId !== undefined && data.attributeId !== existing.attributeId) {
      const attribute = await this.unitOfWork.MasterAttribute.findById(data.attributeId);
      if (!attribute) throw new NotFoundError("Master attribute not found");
      if (attribute.storeCode !== existing.storeCode) {
        throw new ForbiddenError("Master attribute does not belong to your store");
      }
    }

    return this.unitOfWork.transaction(async (transactionClient) => {
      await transactionClient.masterEntry.update({
        where: { id },
        data: {
          ...(data.attributeId !== undefined && { attributeId: data.attributeId }),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.value !== undefined && { value: data.value }),
          ...(data.colorHex !== undefined && { colorHex: data.colorHex || null }),
          ...(data.metadata !== undefined && data.metadata !== null && { metadata: data.metadata }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder ?? null }),
        },
      });

      const entry = await this.unitOfWork.MasterEntry.findById(id, transactionClient);
      if (!entry) throw new NotFoundError("Master entry not found");
      return entry;
    });
  }

  async delete(id: number): Promise<MasterEntryDto> {
    const existing = await this.unitOfWork.MasterEntry.findById(id);
    if (!existing) throw new NotFoundError("Master entry not found");
    if (existing.status === Status.Trash) return existing;
    return this.unitOfWork.MasterEntry.delete(id);
  }
}
