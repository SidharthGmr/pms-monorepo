import {
  CustomResponse as Response,
  ExpenseDto,
  ExpenseFilterParams,
  ExpenseModel,
  ExpenseStatusModel,
  ExpenseSummaryDto,
  ExpenseSummaryParams,
  ListResponseDto,
} from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface IExpenseService {
  create(model: ExpenseModel): Promise<AxiosResponse<Response<ExpenseDto>>>;
  getAll(params?: ExpenseFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ExpenseDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<ExpenseDto>>>;
  update(id: number | string, model: ExpenseModel): Promise<AxiosResponse<Response<ExpenseDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<ExpenseDto>>>;
  updateStatus(id: number | string, model: ExpenseStatusModel): Promise<AxiosResponse<Response<ExpenseDto>>>;
  getSummary(params?: ExpenseSummaryParams): Promise<AxiosResponse<Response<ExpenseSummaryDto>>>;
  runRecurring(): Promise<AxiosResponse<Response<ExpenseDto[]>>>;
}
