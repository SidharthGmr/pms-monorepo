import { ExpenseDto, ExpenseFilterParams, ExpenseSummaryDto, ExpenseSummaryParams, ListResponseDto } from '@pms/types';

export interface IExpenseRepository {
  findAll(
    filters?: ExpenseFilterParams,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<ListResponseDto<ExpenseDto>>;
  findById(id: number): Promise<ExpenseDto | null>;
  /** Templates whose next due date has arrived, for the recurring-expense run. */
  findDueTemplates(storeCode: string, onDate: Date): Promise<ExpenseDto[]>;
  summary(storeCode: string, filters?: ExpenseSummaryParams): Promise<ExpenseSummaryDto>;
  delete(id: number): Promise<ExpenseDto>;
}
