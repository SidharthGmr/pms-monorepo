import prisma from '../config/prisma';
import { CreatePurchaseModel } from '../models/purchase.model';
import { IPurchaseRepository } from './interfaces/ipurchase.repository';

export class PurchaseRepository implements IPurchaseRepository {
  // async createPurchase(data: CreatePurchaseModel, userId: number, storeCode: string): Promise<any> {
  //   return prisma.$transaction(async (tx) => {
  //     const purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : new Date();

  //     const purchase = await tx.purchase.create({
  //       data: {
  //         invoiceNumber: data.invoiceNumber || null,
  //         invoiceUrl: data.invoiceUrl || null,
  //         supplierName: data.supplierName || null,
  //         totalAmount: data.totalAmount,
  //         notes: data.notes || null,
  //         storeCode: storeCode,
  //         userId: userId,
  //         purchaseDate: purchaseDate,
  //         items: {
  //           create: data.items.map(item => ({
  //             productId: item.productId,
  //             quantity: item.quantity,
  //             unitCost: item.unitCost,
  //             totalCost: item.totalCost,
  //           }))
  //         }
  //       },
  //       include: { items: true }
  //     });

  //     // Update product stock and insert stock history for each item
  //     for (const item of data.items) {
  //       await tx.product.update({
  //         where: { id: item.productId },
  //         data: { stock: { increment: item.quantity } }
  //       });

  //       await tx.stockHistory.create({
  //         data: {
  //           productId: item.productId,
  //           storeCode: storeCode,
  //           userId: userId,
  //           quantity: item.quantity,
  //           reason: `Purchase Invoice: ${data.invoiceNumber || purchase.id}`
  //         }
  //       });
  //     }

  //     return purchase;
  //   });
  // }

  // async getAllPurchases(storeCode: string, page: number, limit: number, search?: string): Promise<{ data: any[], total: number }> {
  //   const skip = (page - 1) * limit;

  //   const whereClause: any = { storeCode };
  //   if (search) {
  //     whereClause.OR = [
  //       { invoiceNumber: { contains: search, mode: 'insensitive' } },
  //       { supplierName: { contains: search, mode: 'insensitive' } }
  //     ];
  //   }

  //   const [data, total] = await Promise.all([
  //     prisma.purchase.findMany({
  //       where: whereClause,
  //       include: {
  //         user: { select: { name: true, email: true } },
  //         items: true
  //       },
  //       skip,
  //       take: limit,
  //       orderBy: { purchaseDate: 'desc' }
  //     }),
  //     prisma.purchase.count({ where: whereClause })
  //   ]);

  //   return { data, total };
  // }

  // async getPurchaseById(id: number, storeCode: string): Promise<any> {
  //   return prisma.purchase.findFirst({
  //     where: { id, storeCode },
  //     include: {
  //       user: { select: { name: true, email: true } },
  //       items: { include: { product: true } }
  //     }
  //   });
  // }
}
