import { ListResponseDto } from "@pms/types";
import { StoreDto, CreateStoreDto } from "../../dtos/store.dto";
import { StoreFilterParams } from "../../params/store.params";

export interface IStoreRepository {
  create(data: CreateStoreDto): Promise<StoreDto>;
  findAll(filters?: StoreFilterParams, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<ListResponseDto<StoreDto>>;
  getById(id: number): Promise<StoreDto>;
  delete(id: number): Promise<StoreDto>;
  checkExists(field: "name" | "code", value: string, excludeId?: number): Promise<boolean>;
}

