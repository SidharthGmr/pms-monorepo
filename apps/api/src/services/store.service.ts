import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { StoreDto, CreateStoreDto, UpdateStoreDto } from "../dtos/store.dto";
import { StoreFilterParams } from "../params/store.params";
import { CreateStoreModel, UpdateStoreModel } from "../models/store.model";
import { IStoreService } from "./interfaces/Istore.service";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import CustomError from "../exceptions/custom-error";

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
          address: data.address || null,
          phone: data.phone || null,
          email: data.email || null,
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

  async getAll(filters: StoreFilterParams): Promise<{ data: StoreDto[]; total: number; page: number; recordPerPage: number }> {
    return this.unitOfWork.Store.getAll(filters);
  }

  async getById(id: number): Promise<StoreDto> {
    return this.unitOfWork.Store.getById(id);
  }


  async update(id: number, data: CreateStoreModel): Promise<StoreDto> {
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
      const storeData = await transactionClient.store.update({
        where: { id },
        data: {
          name: data.name,
          code: data.code,
          address: data.address || null,
          phone: data.phone || null,
          email: data.email || null,
          isActive: data.isActive ?? true,
          status: data.status || "Published",
        },
      });

      return storeData;
    });
  }



  async delete(id: number): Promise<StoreDto> {
    return this.unitOfWork.Store.delete(id);
  }
}
