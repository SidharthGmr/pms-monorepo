import { EstimateDto, EstimateFilterParams, EstimateModel, ListResponseDto } from '@pms/types';

export interface IEstimateService {
  create(data: EstimateModel, storeCode: string, createdById: string): Promise<EstimateDto>;
  getAll(filters?: EstimateFilterParams): Promise<ListResponseDto<EstimateDto>>;
  getById(id: number, storeCode?: string): Promise<EstimateDto | null>;
  update(id: number, data: EstimateModel, storeCode: string, updatedById: string): Promise<EstimateDto>;
  delete(id: number, storeCode: string): Promise<EstimateDto>;
}
