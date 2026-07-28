import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import { IPurchaseService } from './interfaces/ipurchase.service';
import { CreatePurchaseModel, PurchaseResponseDto } from '@pms/types';
import IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { ListResponseDto } from '../dtos/list-response.dto';
import NotFoundError from '../exceptions/not-found-error';
import { PricingUtils } from '../utils/authHelpers.service';
import { buildVariantSku } from '../utils/variant-sku';

@injectable()
export class PurchaseService implements IPurchaseService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  async create(data: CreatePurchaseModel, userId: string, storeCode: string): Promise<PurchaseResponseDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      const productIds = [...new Set(data.items.map((item) => item.productId))];
      const products = await transactionClient.product.findMany({
        where: { id: { in: productIds }, storeCode },
        select: { id: true },
      });
      if (products.length !== productIds.length) {
        throw new NotFoundError('One or more products were not found in this store');
      }

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
              productId: item.productId,
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
          productId: item.productId,
          storeCode,
          userId: userId,
          quantity: item.quantity,
          reason: `Purchase #${purchase.id}`,
        })),
      });

      const uniquePrices = Array.from(
        new Map(data.items.map(item => [item.productId, { productId: item.productId, costPrice: item.costPrice }])).values()
      );

      // The new variants must end up active (a plain createMany used to leave them
      // all isActive = false, so nothing was ever the active price). Do it in two
      // batched queries rather than two per product — this runs inside an
      // interactive transaction against a remote database, where a per-product
      // round-trip loop blows the transaction timeout.
      await transactionClient.productVariant.updateMany({
        where: { productId: { in: uniquePrices.map((item) => item.productId) }, isActive: true },
        data: { isActive: false },
      });

      await transactionClient.productVariant.createMany({
        data: uniquePrices.map((item) => ({
          productId: item.productId,
          storeCode,
          sellingPrice: PricingUtils.costToSellingPrice(item.costPrice),
          costPrice: +item.costPrice,
          isActive: true,
          reason: `Purchase #${purchase.id}`,
          createdById: userId,
          // sku is @unique and NOT NULL. `uniquePrices` is keyed by productId, so
          // productId + purchase id is unique both within this batch and across
          // purchases - a timestamp would not be, since every row shares one tick.
          sku: buildVariantSku(storeCode, item.productId, `PUR${purchase.id}`),
          attributes: {},
        })),
      });

      return purchase;
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
