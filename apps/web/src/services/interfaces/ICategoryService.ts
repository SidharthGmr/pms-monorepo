import { AxiosResponse } from 'axios';
import { CategoryModel, CategoryResponseDto } from '@pms/types';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';
import { CategoryFilterParams } from '@pms/types';

export default interface ICategoryService {
    create(model: CategoryModel): Promise<AxiosResponse<Response<CategoryResponseDto>>>;
    getAll(params?: CategoryFilterParams): Promise<AxiosResponse<Response<ListResponseDto<CategoryResponseDto>>>>;
    getById(id: number | string): Promise<AxiosResponse<Response<CategoryResponseDto>>>;
    update(id: number | string, model: Partial<CategoryModel>): Promise<AxiosResponse<Response<CategoryResponseDto>>>;
    delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
