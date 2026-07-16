import { ListResponseDto, PurchaseResponseDto } from "@pms/types";
export interface IPurchaseRepository {
  getAllPurchases(storeCode: string, page: number, limit: number, search?: string): Promise<ListResponseDto<PurchaseResponseDto>>;
  getPurchaseById(id: number, storeCode: string): Promise<PurchaseResponseDto | null>;
}
