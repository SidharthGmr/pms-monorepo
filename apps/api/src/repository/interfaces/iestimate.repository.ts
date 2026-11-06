import { EstimateDto, EstimateFilterParams, ListResponseDto } from '@pms/types';

export interface IEstimateRepository {
  findAll(
    filters?: EstimateFilterParams,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<ListResponseDto<EstimateDto>>;
  findById(id: number): Promise<EstimateDto | null>;
  findByNumber(storeCode: string, estimateNumber: string): Promise<EstimateDto | null>;
  findByPublicToken(publicToken: string): Promise<EstimateDto | null>;
  /** Returns the existing token when one was already minted, so a link stays stable. */
  ensurePublicToken(id: number, token: string): Promise<string>;
  delete(id: number): Promise<EstimateDto>;
}
