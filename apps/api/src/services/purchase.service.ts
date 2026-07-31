import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import { IPurchaseService } from './interfaces/ipurchase.service';
import { CreatePurchaseModel, PurchaseResponseDto } from '@pms/types';
import IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { ListResponseDto } from '../dtos/list-response.dto';
import NotFoundError from '../exceptions/not-found-error';
import { PricingUtils } from '../utils/authHelpers.service';

@injectable()
export class PurchaseService implements IPurchaseService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  async create(data: CreatePurchaseModel, userId: string, storeCode: string): Promise<PurchaseResponseDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      // Stock is received against variants now, so the store check is on variants and the
      // product id for each line comes from its variant rather than from the request.
      const variantIds = [...new Set(data.items.map((item) => item.variantId))];
      const variants = await transactionClient.productVariant.findMany({
        where: { id: { in: variantIds }, storeCode, deletedAt: null },
        select: { id: true, productId: true },
      });
      if (variants.length !== variantIds.length) {
        throw new NotFoundError('One or more product variants were not found in this store');
      }
      const productIdByVariant = new Map(variants.map((variant) => [variant.id, variant.productId]));

      const user = await transactionClient.users.findUnique({ where: { userId } });
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const purchase = await transactionClient.purchase.create({
        data: {
          storeCode: storeCode,
          userId: userId,
          invoiceNumber: data.invoiceNumber || '',
          invoiceUrl: data.invoiceUrl || '',
          supplierId: data.supplierId || null,
          supplierName: data.supplierName || '',
          totalAmount: data.totalAmount || 0,
          notes: data.notes ?? null,
          purchaseDate: data.purchaseDate || new Date(),
          items: {
            create: data.items.map((item) => ({
              productId: productIdByVariant.get(item.variantId)!,
              variantId: item.variantId,
              quantity: item.quantity,
              costPrice: item.costPrice,
              totalPrice: item.totalPrice,
            })),
          },
        },
        include: { items: true },
      });

      await transactionClient.stockHistory.createMany({
        data: data.items.map((item) => ({
          productId: productIdByVariant.get(item.variantId)!,
          variantId: item.variantId,
          storeCode,
          createdById: userId,
          quantity: item.quantity,
          reason: `Purchase #${purchase.id}`,
        })),
      });

      // A purchase re-costs what it receives. That is a price change on the existing
      // variant, so it goes to the ledger - the old code minted a throwaway variant per
      // purchase, which is what turned every restock into a phantom size.
      const latestCostByVariant = new Map(data.items.map((item) => [item.variantId, item.costPrice]));

      for (const [variantId, costPrice] of latestCostByVariant) {
        await this.unitOfWork.PriceHistory.create(
          {
            variantId,
            storeCode,
            sellingPrice: PricingUtils.costToSellingPrice(costPrice),
            costPrice: +costPrice,
            reason: `Purchase #${purchase.id}`,
            createdById: userId,
          },
          transactionClient
        );
      }

      // Decimal columns serialize to strings; the API contract is plain numbers.
      return {
        ...purchase,
        items: purchase.items.map((item) => ({
          ...item,
          costPrice: item.costPrice.toNumber(),
          totalPrice: item.totalPrice.toNumber(),
        })),
      };
    });
  }

  async getAllPurchases(
    storeCode: string,
    page: number,
    limit: number,
    search?: string,
    startDate?: Date,
    endDate?: Date,
    sortBy?: string,
    sortOrder?: string
  ): Promise<ListResponseDto<PurchaseResponseDto>> {
    return this.unitOfWork.Purchase.getAllPurchases(storeCode, page, limit, search, startDate, endDate, sortBy, sortOrder);
  }

  async getPurchaseById(id: number, storeCode: string): Promise<PurchaseResponseDto> {
    const purchase = await this.unitOfWork.Purchase.getPurchaseById(id, storeCode);
    if (!purchase) throw new NotFoundError('Purchase not found');
    return purchase;
  }
}
