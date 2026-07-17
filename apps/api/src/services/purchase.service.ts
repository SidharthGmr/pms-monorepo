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

      function calculateSellingPrice(costPrice: number, markupPercent: number = 30): string {
        const selling = costPrice * (1 + markupPercent / 100);
        return selling.toFixed(2);
      }

      await transactionClient.productPrice.createMany({
        data: uniquePrices.map(p => ({
          productId: p.productId,
          storeCode,
          costPrice: +p.costPrice,
          createdById: userId,
          isActive: false,
          sellingPrice: PricingUtils.costToSellingPrice(p.costPrice)
        })),
      });

      return purchase;
    });
  }

  async getAllPurchases(storeCode: string, page: number, limit: number, search?: string): Promise<ListResponseDto<PurchaseResponseDto>> {
    return this.unitOfWork.Purchase.getAllPurchases(storeCode, page, limit, search);
  }

  async getPurchaseById(id: number, storeCode: string): Promise<PurchaseResponseDto> {
    const purchase = await this.unitOfWork.Purchase.getPurchaseById(id, storeCode);
    if (!purchase) throw new NotFoundError('Purchase not found');
    return purchase;
  }
}
