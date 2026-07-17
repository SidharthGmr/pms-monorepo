import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { SupplierDto, CreateSupplierDto } from "../dtos/supplier.dto";
import { ListResponseDto } from "../dtos/list-response.dto";
import NotFoundError from "../exceptions/not-found-error";
import { SupplierFilterParams } from "../params/supplier.params";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { ISupplierService } from "./interfaces/Isupplier.service";
import { StatusEnum } from "@pms/types";

@injectable()
export class SupplierService implements ISupplierService {
  constructor(
    @inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork
  ) { }

  async getAll(filters?: SupplierFilterParams): Promise<ListResponseDto<SupplierDto>> {
    return this.unitOfWork.Supplier.findAll(filters);
  }

  async getById(id: number): Promise<SupplierDto | null> {
    const supplier = await this.unitOfWork.Supplier.findById(id);
    if (!supplier) throw new NotFoundError("Supplier not found");
    return supplier;
  }

  async create(data: CreateSupplierDto, storeCode: string): Promise<SupplierDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      const supplier = await transactionClient.supplier.create({
        data: {
          name: data.name,
          contactPerson: data.contactPerson || null,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          notes: data.notes || null,
          storeCode: storeCode,
          status: data.status || StatusEnum.Published,
          displayOrder: data.displayOrder || null,
        },
      });
      return supplier;
    });
  }

  async update(id: number, data: CreateSupplierDto): Promise<SupplierDto> {
    const existing = await this.unitOfWork.Supplier.findById(id);
    if (!existing) throw new NotFoundError("Supplier not found");

    return this.unitOfWork.transaction(async (transactionClient) => {
      const supplier = await transactionClient.supplier.update({
        where: { id },
        data: {
          name: data.name,
          contactPerson: data.contactPerson ?? null,
          email: data.email ?? null,
          phone: data.phone ?? null,
          address: data.address ?? null,
          notes: data.notes ?? null,
          status: data.status,
          displayOrder: data.displayOrder || null,
          updatedAt: new Date(),
        },
      });
      return supplier;
    });
  }

  async delete(id: number): Promise<SupplierDto> {
    const existing = await this.unitOfWork.Supplier.findById(id);
    if (!existing) throw new NotFoundError("Supplier not found");
    return this.unitOfWork.Supplier.delete(id);
  }
}
