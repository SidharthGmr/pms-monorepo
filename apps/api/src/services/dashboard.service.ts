import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { IDashboardService } from './interfaces/Idashboard.service';
import { DashboardSummaryDto } from '../dtos/dashboard.dto';

@injectable()
export class DashboardService implements IDashboardService {
  constructor(
    @inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork
  ) {}

  async getSummary(storeCode?: string): Promise<DashboardSummaryDto> {
    return this.unitOfWork.Dashboard.getSummary(storeCode);
  }
}
