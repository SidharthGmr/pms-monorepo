import { ListResponseDto, StoreDto, StoreFilterParams, CreateStoreModel, UpdateMyStoreModel, UpdateStoreModel } from '@pms/types';
export interface IStoreService {
  create(data: CreateStoreModel): Promise<StoreDto>;
  getAll(filters?: StoreFilterParams): Promise<ListResponseDto<StoreDto>>;
  getById(id: number): Promise<StoreDto>;
  /** Resolves the tenancy key used elsewhere (`code`) to the numeric id Cart needs. */
  getByCode(code: string): Promise<StoreDto | null>;
  update(id: number, data: UpdateStoreModel): Promise<StoreDto>;
  delete(id: number): Promise<StoreDto>;
  /** The admin self-service slice: contact details and branding of the caller's own store. */
  updateMyStore(code: string, data: UpdateMyStoreModel): Promise<StoreDto>;
}
