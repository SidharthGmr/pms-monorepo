import { AxiosResponse } from 'axios';
import { StaffSalaryDto } from '@/dtos/staff-salary.dto';
import { CreateStaffSalaryModel, UpdateStaffSalaryModel } from '@/models/staff-salary.model';
import { StaffSalaryFilterParams } from '@/params/staff-salary.params';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';

export default interface IStaffSalaryService {
    create(model: CreateStaffSalaryModel): Promise<AxiosResponse<Response<StaffSalaryDto>>>;
    getAll(params?: StaffSalaryFilterParams): Promise<AxiosResponse<Response<ListResponseDto<StaffSalaryDto>>>>;
    getById(id: number | string): Promise<AxiosResponse<Response<StaffSalaryDto>>>;
    getByStaffId(staffId: number, params?: StaffSalaryFilterParams): Promise<AxiosResponse<Response<ListResponseDto<StaffSalaryDto>>>>;
    update(id: number | string, model: UpdateStaffSalaryModel): Promise<AxiosResponse<Response<StaffSalaryDto>>>;
    delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
