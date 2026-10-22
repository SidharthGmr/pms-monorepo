import { injectable } from 'inversify';
import { AxiosResponse } from 'axios';
import { TYPES } from '@/config/types';
import { container } from '@/config/ioc';
import IHttpService from './interfaces/IHttpService';
import IDashboardService from './interfaces/IDashboardService';

import { CustomResponse as Response, DashboardSummaryDto } from '@pms/types';
@injectable()
export default class DashboardService implements IDashboardService {
    private readonly httpService: IHttpService;

    constructor(
        httpService = container.get<IHttpService>(TYPES.IHttpService)
    ) {
        this.httpService = httpService;
    }

    getSummary(): Promise<AxiosResponse<Response<DashboardSummaryDto>>> {
        return this.httpService
            .call()
            .get<DashboardSummaryDto, AxiosResponse<Response<DashboardSummaryDto>>>('/dashboard/summary');
    }
}
