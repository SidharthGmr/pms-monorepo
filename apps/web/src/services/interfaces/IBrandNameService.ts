import { AxiosResponse } from 'axios';
import { BrandNameDto, BrandNameFilterParams, CreateBrandNameModel } from '@pms/types';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';

export default interface IBrandNameService {

    create(model: CreateBrandNameModel): Promise<AxiosResponse<Response<BrandNameDto>>>;
    getAll(params?: BrandNameFilterParams): Promise<AxiosResponse<Response<ListResponseDto<BrandNameDto>>>>;
    getById(id: number | string): Promise<AxiosResponse<Response<BrandNameDto>>>;
    update(id: number | string, model: CreateBrandNameModel): Promise<AxiosResponse<Response<BrandNameDto>>>;
    delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
