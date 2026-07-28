import { Status } from "@prisma/client";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { ListResponseDto } from "../dtos/list-response.dto";
import { CreateMasterEntryDto, MasterEntryDto } from "../dtos/master-entry.dto";
import ForbiddenError from "../exceptions/forbidden-error";
import NotFoundError from "../exceptions/not-found-error";
import { MasterEntryFilterParams } from "../params/master-entry.params";
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

  async create(data: CreateMasterEntryDto, storeCode: string): Promise<MasterEntryDto> {
    // An entry inherits its store from its parent group, so a value can never be
    // filed under a store the attribute does not belong to.
    const attribute = await this.unitOfWork.MasterAttribute.findById(data.attributeId);
    if (!attribute) throw new NotFoundError("Master attribute not found");
    if (attribute.storeCode !== storeCode) throw new ForbiddenError("Master attribute does not belong to your store");

    return this.unitOfWork.transaction(async (transactionClient) => {
      const created = await transactionClient.masterEntry.create({
        data: {
          attributeId: data.attributeId,
          name: data.name,
          value: data.value,
          colorHex: data.colorHex || null,
          ...(data.metadata !== undefined && data.metadata !== null && { metadata: data.metadata }),
          storeCode: attribute.storeCode,
          status: data.status ?? Status.Published,
          displayOrder: data.displayOrder ?? null,
        },
        select: { id: true },
      });

      // Read back through the transaction client - the global one cannot see this row yet.
      const entry = await this.unitOfWork.MasterEntry.findById(created.id, transactionClient);
      if (!entry) throw new NotFoundError("Master entry not found");
      return entry;
    });
  }

  async update(id: number, data: CreateMasterEntryDto): Promise<MasterEntryDto> {
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
