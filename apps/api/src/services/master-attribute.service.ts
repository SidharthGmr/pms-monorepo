import { Status } from "@prisma/client";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { ListResponseDto } from "../dtos/list-response.dto";
import { CreateMasterAttributeDto, MasterAttributeDto } from "../dtos/master-entry.dto";
import NotFoundError from "../exceptions/not-found-error";
import { MasterAttributeFilterParams } from "../params/master-entry.params";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { IMasterAttributeService } from "./interfaces/Imaster-attribute.service";

@injectable()
export class MasterAttributeService implements IMasterAttributeService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  async getAll(filters?: MasterAttributeFilterParams): Promise<ListResponseDto<MasterAttributeDto>> {
    return this.unitOfWork.MasterAttribute.findAll(filters);
  }

  async getById(id: number): Promise<MasterAttributeDto | null> {
    const attribute = await this.unitOfWork.MasterAttribute.findById(id);
    if (!attribute) throw new NotFoundError("Master attribute not found");
    return attribute;
  }

  async getByCode(code: string, storeCode: string): Promise<MasterAttributeDto | null> {
    const attribute = await this.unitOfWork.MasterAttribute.findByCode(code, storeCode);
    if (!attribute) throw new NotFoundError("Master attribute not found");
    return attribute;
  }

  async create(data: CreateMasterAttributeDto, storeCode: string): Promise<MasterAttributeDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      const created = await transactionClient.masterAttribute.create({
        data: {
          name: data.name,
          code: data.code.toUpperCase(),
          description: data.description || null,
          unit: data.unit || null,
          storeCode,
          status: data.status ?? Status.Published,
          displayOrder: data.displayOrder ?? null,
        },
        select: { id: true },
      });

      // Read back through the transaction client - the global one cannot see this row yet.
      const attribute = await this.unitOfWork.MasterAttribute.findById(created.id, transactionClient);
      if (!attribute) throw new NotFoundError("Master attribute not found");
      return attribute;
    });
  }

  async update(id: number, data: CreateMasterAttributeDto): Promise<MasterAttributeDto> {
    const existing = await this.unitOfWork.MasterAttribute.findById(id);
    if (!existing) throw new NotFoundError("Master attribute not found");

    return this.unitOfWork.transaction(async (transactionClient) => {
      await transactionClient.masterAttribute.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.code !== undefined && { code: data.code.toUpperCase() }),
          ...(data.description !== undefined && { description: data.description || null }),
          ...(data.unit !== undefined && { unit: data.unit || null }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder ?? null }),
        },
      });

      const attribute = await this.unitOfWork.MasterAttribute.findById(id, transactionClient);
      if (!attribute) throw new NotFoundError("Master attribute not found");
      return attribute;
    });
  }

  async delete(id: number): Promise<MasterAttributeDto> {
    const existing = await this.unitOfWork.MasterAttribute.findById(id);
    if (!existing) throw new NotFoundError("Master attribute not found");
    if (existing.status === Status.Trash) return existing;

    // Trashing the group hides its values too, so the two stay consistent - the DB
    // cascade only fires on a hard delete, which this is not.
    return this.unitOfWork.transaction(async (transactionClient) => {
      await transactionClient.masterEntry.updateMany({
        where: { attributeId: id, NOT: { status: Status.Trash } },
        data: { status: Status.Trash },
      });
      return this.unitOfWork.MasterAttribute.delete(id);
    });
  }
}
