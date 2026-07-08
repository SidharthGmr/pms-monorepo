import { injectable } from 'inversify';
import { AxiosResponse } from 'axios';
import { TYPES } from '@/config/types';
import { container } from '@/config/ioc';
import IHttpService from './interfaces/IHttpService';
import IStaffService from './interfaces/IStaffService';
import { StaffDto } from '@/dtos/staff.dto';
import { CreateStaffModel, UpdateStaffModel } from '@/models/staff.model';
import { StaffFilterParams } from '@/params/staff.params';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';

@injectable()
export default class StaffService implements IStaffService {
    private readonly httpService: IHttpService;

    constructor(
        httpService = container.get<IHttpService>(TYPES.IHttpService)
    ) {
        this.httpService = httpService;
    }

    create(model: CreateStaffModel): Promise<AxiosResponse<Response<StaffDto>>> {
        return this.httpService
            .call()
            .post<StaffDto, AxiosResponse<Response<StaffDto>>>('/staff', model);
    }

    getAll(params?: StaffFilterParams): Promise<AxiosResponse<Response<ListResponseDto<StaffDto>>>> {
        return this.httpService
            .call()
            .get<ListResponseDto<StaffDto>, AxiosResponse<Response<ListResponseDto<StaffDto>>>>('/staff', { params });
    }

    getCount(): Promise<AxiosResponse<Response<number>>> {
        return this.httpService
            .call()
            .get<number, AxiosResponse<Response<number>>>('/staff/count');
    }

    getByStoreId(storeId: number): Promise<AxiosResponse<Response<ListResponseDto<StaffDto>>>> {
        return this.httpService
            .call()
            .get<ListResponseDto<StaffDto>, AxiosResponse<Response<ListResponseDto<StaffDto>>>>(`/staff/store/${storeId}`);
    }

    getByUserId(userId: number): Promise<AxiosResponse<Response<StaffDto>>> {
        return this.httpService
            .call()
            .get<StaffDto, AxiosResponse<Response<StaffDto>>>(`/staff/user/${userId}`);
    }

    getById(id: number | string): Promise<AxiosResponse<Response<StaffDto>>> {
        return this.httpService
            .call()
            .get<StaffDto, AxiosResponse<Response<StaffDto>>>(`/staff/${id}`);
    }

    update(id: number | string, model: UpdateStaffModel): Promise<AxiosResponse<Response<StaffDto>>> {
        return this.httpService
            .call()
            .put<StaffDto, AxiosResponse<Response<StaffDto>>>(`/staff/${id}`, model);
    }

    delete(id: number | string): Promise<AxiosResponse<Response<void>>> {
        return this.httpService
            .call()
            .delete<void, AxiosResponse<Response<void>>>(`/staff/${id}`);
    }
}
