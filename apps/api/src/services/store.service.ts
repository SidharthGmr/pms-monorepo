import { inject, injectable } from "inversify";
import { Prisma } from "@prisma/client";
import { TYPES } from "../config/ioc.types";



import { IStoreService } from "./interfaces/Istore.service";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import CustomError from "../exceptions/custom-error";
import { ListResponseDto, StoreDto, StoreFilterParams, CreateStoreModel, UpdateMyStoreModel, UpdateStoreModel } from '@pms/types';

// A GSTIN's first two digits ARE the GST state code, so a typed code wins but an absent one
// is read straight off the registration - one less field to get wrong.
const gstFields = (data: { gstin?: string | null; stateCode?: string | null }) => ({
  gstin: data.gstin || null,
  stateCode: data.stateCode || (data.gstin ? data.gstin.slice(0, 2) : null),
});

@injectable()
export class StoreService implements IStoreService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  async create(data: CreateStoreModel): Promise<StoreDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      const nameExists = await transactionClient.store.findFirst({
        where: { name: data.name }
      });
      if (nameExists) {
        throw new CustomError("Store with this name already exists", 400);
      }

      // Check if store with same code exists
      const codeExists = await transactionClient.store.findFirst({
        where: { code: data.code }
      });
      if (codeExists) {
        throw new CustomError("Store with this code already exists", 400);
      }
      const storeData = await transactionClient.store.create({
        data: {
          name: data.name,
          code: data.code,
          phone: data.phone || null,
          email: data.email,
          siteName: data.siteName || null,
          ...gstFields(data),
          storeLogo: data.storeLogo || null,
          isActive: data.isActive ?? true,
          status: data.status || "Published",
        },
      });

      return storeData;
    });
  }
  // async create(data: CreateStoreModel): Promise<StoreDto> {
  //   // Check if store with same name exists
  //   const nameExists = await this.unitOfWork.Store.checkExists("name", data.name);
  //   if (nameExists) {
  //     throw new CustomError("Store with this name already exists", 400);
  //   }

  //   // Check if store with same code exists
  //   const codeExists = await this.unitOfWork.Store.checkExists("code", data.code);
  //   if (codeExists) {
  //     throw new CustomError("Store with this code already exists", 400);
  //   }

  //   return this.unitOfWork.Store.create(data);
  // }

  async getAll(filters?: StoreFilterParams): Promise<ListResponseDto<StoreDto>> {
    return this.unitOfWork.Store.findAll(filters);
  }


  // async getAll(filters: StoreFilterParams): Promise<{ data: StoreDto[]; total: number; page: number; recordPerPage: number }> {
  //   return this.unitOfWork.Store.getAll(filters);
  // }

  async getById(id: number): Promise<StoreDto> {
    return this.unitOfWork.Store.getById(id);
  }

  async getByCode(code: string): Promise<StoreDto | null> {
    return this.unitOfWork.Store.getByCode(code);
  }

  async update(id: number, data: UpdateStoreModel): Promise<StoreDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      const existing = await transactionClient.store.findUnique({ where: { id } });
      if (!existing) {
        throw new CustomError("Store not found", 404);
      }

      // Check if another store already uses this name.
      if (data.name) {
        const nameExists = await transactionClient.store.findFirst({
          where: { name: data.name, id: { not: id } }
        });
        if (nameExists) {
          throw new CustomError("Store with this name already exists", 400);
        }
      }

      // Only touch fields that were provided so partial updates don't wipe existing values.
      // `code` is never written: the tenant key is immutable once the store exists.
      const updateData: Prisma.storeUpdateInput = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.phone !== undefined) updateData.phone = data.phone || null;
      if (data.email !== undefined && data.email !== "") updateData.email = data.email;
      if (data.siteName !== undefined) updateData.siteName = data.siteName || null;
      if (data.gstin !== undefined || data.stateCode !== undefined) {
        const gst = gstFields({ gstin: data.gstin ?? null, stateCode: data.stateCode ?? null });
        if (data.gstin !== undefined) updateData.gstin = gst.gstin;
        updateData.stateCode = gst.stateCode;
      }
      if (data.storeLogo !== undefined) updateData.storeLogo = data.storeLogo || null;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.status !== undefined) updateData.status = data.status;

      const storeData = await transactionClient.store.update({
        where: { id },
        data: updateData,
      });

      return storeData;
    });
  }

  async delete(id: number): Promise<StoreDto> {
    return this.unitOfWork.Store.delete(id);
  }

  // The admin self-service slice: only contact details and branding, resolved by the
  // caller's own storeCode - code, status and isActive stay with the super admin's edit.
  async updateMyStore(code: string, data: UpdateMyStoreModel): Promise<StoreDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      const existing = await transactionClient.store.findUnique({ where: { code } });
      if (!existing) {
        throw new CustomError("Store not found", 404);
      }

      // Check if another store already uses this name.
      const nameExists = await transactionClient.store.findFirst({
        where: { name: data.name, id: { not: existing.id } }
      });
      if (nameExists) {
        throw new CustomError("Store with this name already exists", 400);
      }

      const storeData = await transactionClient.store.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          phone: data.phone || null,
          email: data.email,
          siteName: data.siteName || null,
          ...gstFields(data),
          storeLogo: data.storeLogo || null,
        },
      });

      return storeData;
    });
  }
}
