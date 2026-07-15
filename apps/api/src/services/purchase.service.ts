import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import { CreatePurchaseModel } from '../models/purchase.model';
import { IPurchaseRepository } from '../repository/interfaces/ipurchase.repository';
import { IPurchaseService } from './interfaces/ipurchase.service';

import prisma from '../config/prisma';

@injectable()
export class PurchaseService implements IPurchaseService {
  private purchaseRepository: IPurchaseRepository;

  constructor(
    @inject(TYPES.IPurchaseRepository) purchaseRepository: IPurchaseRepository
  ) {
    this.purchaseRepository = purchaseRepository;
  }

  // async createPurchase(data: CreatePurchaseModel, userIdStr: string, storeCode: string): Promise<any> {
  //   const user = await prisma.users.findUnique({ where: { userId: userIdStr } });
  //   if (!user) {
  //     throw new Error("Invalid user ID");
  //   }
  //   const userId = user.id;

  //   if (!data.items || data.items.length === 0) {
  //     throw new Error("Purchase must contain at least one item");
  //   }

  //   return this.purchaseRepository.createPurchase(data, userId, storeCode);
  // }

  // async getAllPurchases(storeCode: string, page: number, limit: number, search?: string): Promise<any> {
  //   const result = await this.purchaseRepository.getAllPurchases(storeCode, page, limit, search);
  //   return {
  //     data: result.data,
  //     totalRecord: result.total,
  //     currentPage: page,
  //     totalPage: Math.ceil(result.total / limit)
  //   };
  // }

  // async getPurchaseById(id: number, storeCode: string): Promise<any> {
  //   const purchase = await this.purchaseRepository.getPurchaseById(id, storeCode);
  //   if (!purchase) throw new Error("Purchase not found");
  //   return purchase;
  // }
}
