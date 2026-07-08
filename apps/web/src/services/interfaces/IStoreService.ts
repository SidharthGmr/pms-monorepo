import { AxiosResponse } from 'axios';
import { StoreDto } from '@/dtos/store.dto';
import { CreateStoreModel, UpdateStoreModel } from '@/models/store.model';
import { StoreFilterParams } from '@/params/store.params';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';

export default interface IStoreService {
    create(model: CreateStoreModel): Promise<AxiosResponse<Response<StoreDto>>>;
    getAll(params?: StoreFilterParams): Promise<AxiosResponse<Response<ListResponseDto<StoreDto>>>>;
    getById(id: number | string): Promise<AxiosResponse<Response<StoreDto>>>;
    update(id: number | string, model: UpdateStoreModel): Promise<AxiosResponse<Response<StoreDto>>>;
    delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
