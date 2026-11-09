import {
  LedgerAccountDto,
  LedgerAccountFilterParams,
  LedgerAccountTreeDto,
  LedgerStatementDto,
  LedgerStatementFilterParams,
  ListResponseDto,
  TrialBalanceDto,
} from '@pms/types';

export interface ILedgerAccountRepository {
  findAll(
    filters?: LedgerAccountFilterParams,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<ListResponseDto<LedgerAccountDto>>;
  findById(id: number, storeCode: string): Promise<LedgerAccountDto | null>;
  delete(id: number, storeCode: string): Promise<LedgerAccountDto>;
  findTree(storeCode: string): Promise<LedgerAccountTreeDto[]>;
  findByCode(code: string, storeCode: string): Promise<LedgerAccountDto | null>;
  countLines(id: number, storeCode: string): Promise<number>;
  countChildren(id: number, storeCode: string): Promise<number>;
  statement(id: number, storeCode: string, filters?: LedgerStatementFilterParams): Promise<LedgerStatementDto | null>;
  trialBalance(storeCode: string, filters?: LedgerStatementFilterParams): Promise<TrialBalanceDto>;
}
