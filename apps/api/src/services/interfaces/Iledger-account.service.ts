import {
  LedgerAccountDto,
  LedgerAccountFilterParams,
  LedgerAccountModel,
  LedgerAccountTreeDto,
  LedgerStatementDto,
  LedgerStatementFilterParams,
  ListResponseDto,
  TrialBalanceDto,
} from '@pms/types';

export interface ILedgerAccountService {
  create(data: LedgerAccountModel, storeCode: string, createdById: string): Promise<LedgerAccountDto>;
  getAll(filters?: LedgerAccountFilterParams): Promise<ListResponseDto<LedgerAccountDto>>;
  getById(id: number, storeCode: string): Promise<LedgerAccountDto | null>;
  update(id: number, data: LedgerAccountModel, storeCode: string, updatedById: string): Promise<LedgerAccountDto>;
  delete(id: number, storeCode: string): Promise<LedgerAccountDto>;
  getTree(storeCode: string): Promise<LedgerAccountTreeDto[]>;
  seedDefaults(storeCode: string, createdById: string): Promise<ListResponseDto<LedgerAccountDto>>;
  getStatement(id: number, storeCode: string, filters?: LedgerStatementFilterParams): Promise<LedgerStatementDto>;
  getTrialBalance(storeCode: string, filters?: LedgerStatementFilterParams): Promise<TrialBalanceDto>;
}
