import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import { IPurchaseService } from '../services/interfaces/ipurchase.service';

@injectable()
export class PurchaseController {
  private purchaseService: IPurchaseService;

  constructor(
    @inject(TYPES.IPurchaseService) purchaseService: IPurchaseService
  ) {
    this.purchaseService = purchaseService;
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;
      const userId = req.user?.userId as string;
      const storeCode = req.user?.storeCode as string;

      if (!userId || !storeCode) {
        res.status(400).json({ error: "Missing user ID or store code" });
        return;
      }

      const result = await this.purchaseService.createPurchase(data, userId, storeCode);
      res.status(201).json({ message: "Purchase created successfully", data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error creating purchase' });
    }
  }

  async getAllPurchases(req: Request, res: Response): Promise<void> {
    try {
      const storeCode = req.user?.storeCode as string;
      if (!storeCode) {
        res.status(400).json({ error: "Missing store code" });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.recordPerPage as string) || 10;
      const search = req.query.search as string;

      const result = await this.purchaseService.getAllPurchases(storeCode, page, limit, search);
      res.status(200).json({ data: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error fetching purchases' });
    }
  }

  async getPurchaseById(req: Request, res: Response): Promise<void> {
    try {
      const storeCode = req.user?.storeCode as string;
      const id = parseInt(req.params.id as string || '10');

      if (!storeCode || isNaN(id)) {
        res.status(400).json({ error: "Invalid parameters" });
        return;
      }

      const result = await this.purchaseService.getPurchaseById(id, storeCode);
      res.status(200).json({ data: result });
    } catch (error: any) {
      res.status(404).json({ error: error.message || 'Error fetching purchase' });
    }
  }
}
