import { AxiosResponse } from 'axios';

import { CustomResponse as Response, DashboardSummaryDto } from '@pms/types';
export default interface IDashboardService {
    getSummary(): Promise<AxiosResponse<Response<DashboardSummaryDto>>>;
}
