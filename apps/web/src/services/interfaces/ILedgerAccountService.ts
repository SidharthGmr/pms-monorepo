import {
  CustomResponse as Response,
  LedgerAccountDto,
  LedgerAccountFilterParams,
  LedgerAccountModel,
  LedgerAccountTreeDto,
  LedgerStatementDto,
  LedgerStatementFilterParams,
  ListResponseDto,
  TrialBalanceDto,
} from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface ILedgerAccountService {
  create(model: LedgerAccountModel): Promise<AxiosResponse<Response<LedgerAccountDto>>>;
  getAll(params?: LedgerAccountFilterParams): Promise<AxiosResponse<Response<ListResponseDto<LedgerAccountDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<LedgerAccountDto>>>;
  update(id: number | string, model: LedgerAccountModel): Promise<AxiosResponse<Response<LedgerAccountDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<LedgerAccountDto>>>;
  getTree(): Promise<AxiosResponse<Response<LedgerAccountTreeDto[]>>>;
  seedDefaults(): Promise<AxiosResponse<Response<ListResponseDto<LedgerAccountDto>>>>;
  getStatement(id: number | string, params?: LedgerStatementFilterParams): Promise<AxiosResponse<Response<LedgerStatementDto>>>;
  getTrialBalance(params?: LedgerStatementFilterParams): Promise<AxiosResponse<Response<TrialBalanceDto>>>;
}
