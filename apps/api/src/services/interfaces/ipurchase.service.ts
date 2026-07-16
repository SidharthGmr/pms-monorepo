import { CreatePurchaseModel, ListResponseDto, PurchaseResponseDto } from "@pms/types";

export interface IPurchaseService {
  create(data: CreatePurchaseModel, userId: string, storeCode: string): Promise<PurchaseResponseDto>;
  getAllPurchases(storeCode: string, page: number, limit: number, search?: string): Promise<ListResponseDto<PurchaseResponseDto>>;
  getPurchaseById(id: number, storeCode: string): Promise<PurchaseResponseDto>;
}
