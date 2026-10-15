import { AxiosResponse } from 'axios';
import { DashboardSummaryDto } from '@/dtos/dashboard-summary.dto';
import { CustomResponse as Response } from '@pms/types';

export default interface IDashboardService {
    getSummary(): Promise<AxiosResponse<Response<DashboardSummaryDto>>>;
}
