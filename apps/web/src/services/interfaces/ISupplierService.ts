import { AxiosResponse } from 'axios';
import { SupplierDto } from '@/dtos/supplier.dto';
import { CreateSupplierModel } from '@/models/supplier.model';
import { CustomResponse as Response, ListResponseDto } from '@pms/types';
import { SupplierFilterParams } from '@/params/supplier.params';

export default interface ISupplierService {
    create(model: CreateSupplierModel): Promise<AxiosResponse<Response<SupplierDto>>>;
    getAll(params?: SupplierFilterParams): Promise<AxiosResponse<Response<ListResponseDto<SupplierDto>>>>;
    getById(id: number | string): Promise<AxiosResponse<Response<SupplierDto>>>;
    update(id: number | string, model: CreateSupplierModel): Promise<AxiosResponse<Response<SupplierDto>>>;
    delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
