import { ListResponseDto } from "@pms/types";
import { StoreDto, CreateStoreDto } from "../../dtos/store.dto";
import { StoreFilterParams } from "../../params/store.params";

export interface IStoreRepository {
  create(data: CreateStoreDto): Promise<StoreDto>;
  findAll(filters?: StoreFilterParams, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<ListResponseDto<StoreDto>>;
  getById(id: number): Promise<StoreDto>;
  /** Resolves the tenancy key used elsewhere (`code`) to the numeric id Cart needs. */
  getByCode(code: string): Promise<StoreDto | null>;
  delete(id: number): Promise<StoreDto>;
  checkExists(field: "name" | "code", value: string, excludeId?: number): Promise<boolean>;
}

