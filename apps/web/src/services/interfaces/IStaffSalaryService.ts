import { AxiosResponse } from 'axios';



import { CustomResponse as Response, ListResponseDto, StaffSalaryDto, CreateStaffSalaryModel, UpdateStaffSalaryModel, StaffSalaryFilterParams } from '@pms/types';
export default interface IStaffSalaryService {
    create(model: CreateStaffSalaryModel): Promise<AxiosResponse<Response<StaffSalaryDto>>>;
    getAll(params?: StaffSalaryFilterParams): Promise<AxiosResponse<Response<ListResponseDto<StaffSalaryDto>>>>;
    getById(id: number | string): Promise<AxiosResponse<Response<StaffSalaryDto>>>;
    getByStaffId(staffId: number, params?: StaffSalaryFilterParams): Promise<AxiosResponse<Response<ListResponseDto<StaffSalaryDto>>>>;
    update(id: number | string, model: UpdateStaffSalaryModel): Promise<AxiosResponse<Response<StaffSalaryDto>>>;
    delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
