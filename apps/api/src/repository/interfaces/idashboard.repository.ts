import { DashboardSummaryDto } from '@pms/types';

export interface IDashboardRepository {
  getSummary(storeCode?: string): Promise<DashboardSummaryDto>;
}
