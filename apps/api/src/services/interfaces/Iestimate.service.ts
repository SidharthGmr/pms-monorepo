import {
  EstimateConvertModel,
  EstimateDto,
  EstimateFilterParams,
  EstimateModel,
  EstimateStatusModel,
  ListResponseDto,
  OrderDto,
  PublicDocumentDto,
  ShareLinkDto,
} from '@pms/types';

export interface IEstimateService {
  create(data: EstimateModel, storeCode: string, createdById: string): Promise<EstimateDto>;
  getAll(filters?: EstimateFilterParams): Promise<ListResponseDto<EstimateDto>>;
  getById(id: number, storeCode?: string): Promise<EstimateDto | null>;
  getByNumber(estimateNumber: string, storeCode: string): Promise<EstimateDto | null>;
  update(id: number, data: EstimateModel, storeCode: string, updatedById: string): Promise<EstimateDto>;
  delete(id: number, storeCode: string): Promise<EstimateDto>;
  updateStatus(id: number, data: EstimateStatusModel, storeCode: string, changedById: string): Promise<EstimateDto>;
  createShareLink(id: number, storeCode: string): Promise<ShareLinkDto>;
  getPublic(publicToken: string): Promise<PublicDocumentDto>;
  duplicate(id: number, storeCode: string, createdById: string): Promise<EstimateDto>;
  convert(id: number, data: EstimateConvertModel, storeCode: string, convertedById: string, convertedByName: string): Promise<OrderDto>;
}
