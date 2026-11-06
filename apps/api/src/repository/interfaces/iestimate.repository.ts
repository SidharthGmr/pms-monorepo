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
  delete(id: number): Promise<EstimateDto>;
}
