import { ListResponseDto, PurchaseResponseDto } from "@pms/types";
export interface IPurchaseRepository {
  getAllPurchases(
    storeCode: string,
    page: number,
    limit: number,
    search?: string,
    startDate?: Date,
    endDate?: Date,
    sortBy?: string,
    sortOrder?: string
  ): Promise<ListResponseDto<PurchaseResponseDto>>;
  getPurchaseById(id: number, storeCode: string): Promise<PurchaseResponseDto | null>;
}
