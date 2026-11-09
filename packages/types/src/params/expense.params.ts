import { ExpenseStatus } from '../enum/expense-status.enum';
import { PageFilterParams } from './page.params';

export interface ExpenseFilterParams extends PageFilterParams {
  status?: ExpenseStatus | string;
  expenseAccountId?: number;
  supplierId?: number;
  fromDate?: string;
  toDate?: string;
  /** Templates are hidden by default; pass true to list the recurring definitions instead. */
  isTemplate?: boolean;
}

export interface ExpenseSummaryParams {
  fromDate?: string;
  toDate?: string;
}
