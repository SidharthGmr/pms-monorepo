import { AxiosResponse } from 'axios';



import { CustomResponse as Response, ListResponseDto, StaffDto, CreateStaffModel, UpdateStaffModel, StaffFilterParams } from '@pms/types';
export default interface IStaffService {
    create(model: CreateStaffModel): Promise<AxiosResponse<Response<StaffDto>>>;
    getAll(params?: StaffFilterParams): Promise<AxiosResponse<Response<ListResponseDto<StaffDto>>>>;
    getCount(): Promise<AxiosResponse<Response<number>>>;
    getByStoreId(storeId: number): Promise<AxiosResponse<Response<ListResponseDto<StaffDto>>>>;
    getByUserId(userId: string): Promise<AxiosResponse<Response<StaffDto>>>;
    getById(id: number | string): Promise<AxiosResponse<Response<StaffDto>>>;
    update(id: number | string, model: UpdateStaffModel): Promise<AxiosResponse<Response<StaffDto>>>;
    delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
