import { AxiosResponse } from 'axios';
import { DashboardSummaryDto } from '@/dtos/dashboard-summary.dto';
import Response from '@/dtos/Response';

export default interface IDashboardService {
    getSummary(): Promise<AxiosResponse<Response<DashboardSummaryDto>>>;
}
