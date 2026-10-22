import { AxiosResponse } from 'axios';



import { CustomResponse as Response, ListResponseDto, StoreDto, CreateStoreModel, UpdateStoreModel, StoreFilterParams } from '@pms/types';
export default interface IStoreService {
    create(model: CreateStoreModel): Promise<AxiosResponse<Response<StoreDto>>>;
    getAll(params?: StoreFilterParams): Promise<AxiosResponse<Response<ListResponseDto<StoreDto>>>>;
    getById(id: number | string): Promise<AxiosResponse<Response<StoreDto>>>;
    update(id: number | string, model: UpdateStoreModel): Promise<AxiosResponse<Response<StoreDto>>>;
    delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
