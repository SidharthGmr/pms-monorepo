import { AxiosResponse } from 'axios';
import { CustomResponse as Response, CategoryModel, CategoryResponseDto, ListResponseDto } from '@pms/types';
import { CategoryFilterParams } from '@pms/types';

export default interface ICategoryService {
    create(model: CategoryModel): Promise<AxiosResponse<Response<CategoryResponseDto>>>;
    getAll(params?: CategoryFilterParams): Promise<AxiosResponse<Response<ListResponseDto<CategoryResponseDto>>>>;
    /** Storefront listing - Published, non-deleted categories only, no login needed. */
    getAllPublic(params?: CategoryFilterParams): Promise<AxiosResponse<Response<ListResponseDto<CategoryResponseDto>>>>;
    getById(id: number | string): Promise<AxiosResponse<Response<CategoryResponseDto>>>;
    update(id: number | string, model: Partial<CategoryModel>): Promise<AxiosResponse<Response<CategoryResponseDto>>>;
    delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
