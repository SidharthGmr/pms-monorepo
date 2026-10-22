import { AxiosResponse } from 'axios';


import { CustomResponse as Response, ListResponseDto, SupplierDto, CreateSupplierModel, SupplierFilterParams } from '@pms/types';
export default interface ISupplierService {
    create(model: CreateSupplierModel): Promise<AxiosResponse<Response<SupplierDto>>>;
    getAll(params?: SupplierFilterParams): Promise<AxiosResponse<Response<ListResponseDto<SupplierDto>>>>;
    getById(id: number | string): Promise<AxiosResponse<Response<SupplierDto>>>;
    update(id: number | string, model: CreateSupplierModel): Promise<AxiosResponse<Response<SupplierDto>>>;
    delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
