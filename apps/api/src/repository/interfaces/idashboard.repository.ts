import { DashboardSummaryDto } from '../../dtos/dashboard.dto';

export interface IDashboardRepository {
  getSummary(storeCode?: string): Promise<DashboardSummaryDto>;
}
