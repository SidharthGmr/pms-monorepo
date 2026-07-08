import { injectable } from 'inversify';
import { AxiosResponse } from 'axios';
import { TYPES } from '@/config/types';
import { container } from '@/config/ioc';
import IHttpService from './interfaces/IHttpService';
import IStaffSalaryService from './interfaces/IStaffSalaryService';
import { StaffSalaryDto } from '@/dtos/staff-salary.dto';
import { CreateStaffSalaryModel, UpdateStaffSalaryModel } from '@/models/staff-salary.model';
import { StaffSalaryFilterParams } from '@/params/staff-salary.params';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';

@injectable()
export default class StaffSalaryService implements IStaffSalaryService {
    private readonly httpService: IHttpService;

    constructor(
        httpService = container.get<IHttpService>(TYPES.IHttpService)
    ) {
        this.httpService = httpService;
    }

    create(model: CreateStaffSalaryModel): Promise<AxiosResponse<Response<StaffSalaryDto>>> {
        return this.httpService
            .call()
            .post<StaffSalaryDto, AxiosResponse<Response<StaffSalaryDto>>>('/staff-salaries', model);
    }

    getAll(params?: StaffSalaryFilterParams): Promise<AxiosResponse<Response<ListResponseDto<StaffSalaryDto>>>> {
        return this.httpService
            .call()
            .get<ListResponseDto<StaffSalaryDto>, AxiosResponse<Response<ListResponseDto<StaffSalaryDto>>>>('/staff-salaries', { params });
    }

    getById(id: number | string): Promise<AxiosResponse<Response<StaffSalaryDto>>> {
        return this.httpService
            .call()
            .get<StaffSalaryDto, AxiosResponse<Response<StaffSalaryDto>>>(`/staff-salaries/${id}`);
    }

    getByStaffId(staffId: number, params?: StaffSalaryFilterParams): Promise<AxiosResponse<Response<ListResponseDto<StaffSalaryDto>>>> {
        return this.httpService
            .call()
            .get<ListResponseDto<StaffSalaryDto>, AxiosResponse<Response<ListResponseDto<StaffSalaryDto>>>>(`/staff-salaries/staff/${staffId}`, { params });
    }

    update(id: number | string, model: UpdateStaffSalaryModel): Promise<AxiosResponse<Response<StaffSalaryDto>>> {
        return this.httpService
            .call()
            .put<StaffSalaryDto, AxiosResponse<Response<StaffSalaryDto>>>(`/staff-salaries/${id}`, model);
    }

    delete(id: number | string): Promise<AxiosResponse<Response<void>>> {
        return this.httpService
            .call()
            .delete<void, AxiosResponse<Response<void>>>(`/staff-salaries/${id}`);
    }
}
