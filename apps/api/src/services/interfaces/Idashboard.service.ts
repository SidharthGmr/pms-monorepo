import { DashboardSummaryDto } from '../../dtos/dashboard.dto';

export interface IDashboardService {
  getSummary(storeCode?: string): Promise<DashboardSummaryDto>;
}
