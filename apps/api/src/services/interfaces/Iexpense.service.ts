import { ExpenseDto, ExpenseFilterParams, ExpenseModel, ExpenseStatusModel, ExpenseSummaryDto, ExpenseSummaryParams, ListResponseDto } from '@pms/types';

export interface IExpenseService {
  create(data: ExpenseModel, storeCode: string, createdById: string): Promise<ExpenseDto>;
  getAll(filters?: ExpenseFilterParams): Promise<ListResponseDto<ExpenseDto>>;
  getById(id: number, storeCode?: string): Promise<ExpenseDto | null>;
  update(id: number, data: ExpenseModel, storeCode: string, updatedById: string): Promise<ExpenseDto>;
  updateStatus(id: number, data: ExpenseStatusModel, storeCode: string, changedById: string): Promise<ExpenseDto>;
  delete(id: number, storeCode: string): Promise<ExpenseDto>;
  getSummary(storeCode: string, filters?: ExpenseSummaryParams): Promise<ExpenseSummaryDto>;
  /** Creates the expenses due from recurring templates and rolls each template forward. */
  runRecurring(storeCode: string, createdById: string): Promise<ExpenseDto[]>;
}
