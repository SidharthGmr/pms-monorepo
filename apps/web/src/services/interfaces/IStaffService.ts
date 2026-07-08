import { AxiosResponse } from 'axios';
import { StaffDto } from '@/dtos/staff.dto';
import { CreateStaffModel, UpdateStaffModel } from '@/models/staff.model';
import { StaffFilterParams } from '@/params/staff.params';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';

export default interface IStaffService {
    create(model: CreateStaffModel): Promise<AxiosResponse<Response<StaffDto>>>;
    getAll(params?: StaffFilterParams): Promise<AxiosResponse<Response<ListResponseDto<StaffDto>>>>;
    getCount(): Promise<AxiosResponse<Response<number>>>;
    getByStoreId(storeId: number): Promise<AxiosResponse<Response<ListResponseDto<StaffDto>>>>;
    getByUserId(userId: number): Promise<AxiosResponse<Response<StaffDto>>>;
    getById(id: number | string): Promise<AxiosResponse<Response<StaffDto>>>;
    update(id: number | string, model: UpdateStaffModel): Promise<AxiosResponse<Response<StaffDto>>>;
    delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
