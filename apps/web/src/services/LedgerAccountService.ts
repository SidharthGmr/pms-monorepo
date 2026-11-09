import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
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
  ProfitLossDto,
  ProfitLossParams,
} from '@pms/types';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IHttpService from './interfaces/IHttpService';
import ILedgerAccountService from './interfaces/ILedgerAccountService';

@injectable()
export default class LedgerAccountService implements ILedgerAccountService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  create(model: LedgerAccountModel): Promise<AxiosResponse<Response<LedgerAccountDto>>> {
    return this.httpService.call().post<LedgerAccountDto, AxiosResponse<Response<LedgerAccountDto>>>('/ledger-accounts', model);
  }

  getAll(params?: LedgerAccountFilterParams): Promise<AxiosResponse<Response<ListResponseDto<LedgerAccountDto>>>> {
    return this.httpService
      .call()
      .get<ListResponseDto<LedgerAccountDto>, AxiosResponse<Response<ListResponseDto<LedgerAccountDto>>>>('/ledger-accounts', { params });
  }

  getById(id: number | string): Promise<AxiosResponse<Response<LedgerAccountDto>>> {
    return this.httpService.call().get<LedgerAccountDto, AxiosResponse<Response<LedgerAccountDto>>>(`/ledger-accounts/${id}`);
  }

  update(id: number | string, model: LedgerAccountModel): Promise<AxiosResponse<Response<LedgerAccountDto>>> {
    return this.httpService.call().put<LedgerAccountDto, AxiosResponse<Response<LedgerAccountDto>>>(`/ledger-accounts/${id}`, model);
  }

  delete(id: number | string): Promise<AxiosResponse<Response<LedgerAccountDto>>> {
    return this.httpService.call().delete<LedgerAccountDto, AxiosResponse<Response<LedgerAccountDto>>>(`/ledger-accounts/${id}`);
  }

  getTree(): Promise<AxiosResponse<Response<LedgerAccountTreeDto[]>>> {
    return this.httpService.call().get<LedgerAccountTreeDto[], AxiosResponse<Response<LedgerAccountTreeDto[]>>>('/ledger-accounts/tree');
  }

  getStatement(id: number | string, params?: LedgerStatementFilterParams): Promise<AxiosResponse<Response<LedgerStatementDto>>> {
    return this.httpService
      .call()
      .get<LedgerStatementDto, AxiosResponse<Response<LedgerStatementDto>>>(`/ledger-accounts/${id}/statement`, { params });
  }

  getProfitLoss(params?: ProfitLossParams): Promise<AxiosResponse<Response<ProfitLossDto>>> {
    return this.httpService.call().get<ProfitLossDto, AxiosResponse<Response<ProfitLossDto>>>('/ledger-accounts/profit-loss', { params });
  }

  getTrialBalance(params?: LedgerStatementFilterParams): Promise<AxiosResponse<Response<TrialBalanceDto>>> {
    return this.httpService.call().get<TrialBalanceDto, AxiosResponse<Response<TrialBalanceDto>>>('/ledger-accounts/trial-balance', { params });
  }

  seedDefaults(): Promise<AxiosResponse<Response<ListResponseDto<LedgerAccountDto>>>> {
    return this.httpService
      .call()
      .post<ListResponseDto<LedgerAccountDto>, AxiosResponse<Response<ListResponseDto<LedgerAccountDto>>>>('/ledger-accounts/seed-defaults', {});
  }
}
