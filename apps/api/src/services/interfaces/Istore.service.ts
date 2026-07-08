import { StoreDto, CreateStoreDto, UpdateStoreDto } from "../../dtos/store.dto";
import { StoreFilterParams } from "../../params/store.params";
import { CreateStoreModel, UpdateStoreModel } from "../../models/store.model";

export interface IStoreService {
  create(data: CreateStoreModel): Promise<StoreDto>;
  getAll(filters: StoreFilterParams): Promise<{ data: StoreDto[]; total: number; page: number; recordPerPage: number }>;
  getById(id: number): Promise<StoreDto>;
  update(id: number, data: UpdateStoreModel): Promise<StoreDto>;
  delete(id: number): Promise<StoreDto>;
}
