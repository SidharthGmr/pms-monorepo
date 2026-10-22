import { DashboardSummaryDto } from '@pms/types';

export interface IDashboardService {
  getSummary(storeCode?: string): Promise<DashboardSummaryDto>;
}
