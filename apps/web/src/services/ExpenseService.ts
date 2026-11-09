import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
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
import { injectable } from 'inversify';
import IExpenseService from './interfaces/IExpenseService';
import IHttpService from './interfaces/IHttpService';

@injectable()
export default class ExpenseService implements IExpenseService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  create(model: ExpenseModel): Promise<AxiosResponse<Response<ExpenseDto>>> {
    return this.httpService.call().post<ExpenseDto, AxiosResponse<Response<ExpenseDto>>>('/expenses', model);
  }

  getAll(params?: ExpenseFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ExpenseDto>>>> {
    return this.httpService.call().get<ListResponseDto<ExpenseDto>, AxiosResponse<Response<ListResponseDto<ExpenseDto>>>>('/expenses', { params });
  }

  getById(id: number | string): Promise<AxiosResponse<Response<ExpenseDto>>> {
    return this.httpService.call().get<ExpenseDto, AxiosResponse<Response<ExpenseDto>>>(`/expenses/${id}`);
  }

  update(id: number | string, model: ExpenseModel): Promise<AxiosResponse<Response<ExpenseDto>>> {
    return this.httpService.call().put<ExpenseDto, AxiosResponse<Response<ExpenseDto>>>(`/expenses/${id}`, model);
  }

  delete(id: number | string): Promise<AxiosResponse<Response<ExpenseDto>>> {
    return this.httpService.call().delete<ExpenseDto, AxiosResponse<Response<ExpenseDto>>>(`/expenses/${id}`);
  }

  updateStatus(id: number | string, model: ExpenseStatusModel): Promise<AxiosResponse<Response<ExpenseDto>>> {
    return this.httpService.call().patch<ExpenseDto, AxiosResponse<Response<ExpenseDto>>>(`/expenses/${id}/status`, model);
  }

  getSummary(params?: ExpenseSummaryParams): Promise<AxiosResponse<Response<ExpenseSummaryDto>>> {
    return this.httpService.call().get<ExpenseSummaryDto, AxiosResponse<Response<ExpenseSummaryDto>>>('/expenses/summary', { params });
  }

  runRecurring(): Promise<AxiosResponse<Response<ExpenseDto[]>>> {
    return this.httpService.call().post<ExpenseDto[], AxiosResponse<Response<ExpenseDto[]>>>('/expenses/run-recurring', {});
  }
}
