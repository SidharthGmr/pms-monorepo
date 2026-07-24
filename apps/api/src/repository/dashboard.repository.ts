import prisma from '../config/prisma';
import { DashboardSummaryDto } from '../dtos/dashboard.dto';
import { IDashboardRepository } from './interfaces/idashboard.repository';

const RECENT_LIMIT = 5;

export class DashboardRepository implements IDashboardRepository {
  async getSummary(storeCode?: string): Promise<DashboardSummaryDto> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const productWhere = storeCode ? { storeCode } : {};
    const attributeWhere = storeCode ? { storeCode } : {};

    const todayOrderWhere: any = {
      orderDate: { gte: todayStart, lte: todayEnd },
      status: { not: 'CANCELLED' },
    };
    const monthOrderWhere: any = {
      orderDate: { gte: monthStart, lte: todayEnd },
      status: { not: 'CANCELLED' },
    };
    const todayPurchaseWhere: any = {
      purchaseDate: { gte: todayStart, lte: todayEnd },
      status: { not: 'CANCELLED' },
    };
    const monthPurchaseWhere: any = {
      purchaseDate: { gte: monthStart, lte: todayEnd },
      status: { not: 'CANCELLED' },
    };

    if (storeCode) {
      todayOrderWhere.storeCode = storeCode;
      monthOrderWhere.storeCode = storeCode;
      todayPurchaseWhere.storeCode = storeCode;
      monthPurchaseWhere.storeCode = storeCode;
    }

    const [
      productTotal,
      productRecent,
      attributeTotal,
      attributeRecent,
      todaySaleResult,
      monthSaleResult,
      todayPurchaseResult,
      monthPurchaseResult,
      todayOrderCount,
      monthOrderCount,
      topProductsByOrder,
      totalQuantityResult
    ] = await Promise.all([
      prisma.product.count({ where: productWhere }),
      prisma.product.findMany({ where: productWhere, orderBy: { createdAt: 'desc' }, take: RECENT_LIMIT }),
      prisma.attribute.count({ where: attributeWhere }),
      prisma.attribute.findMany({ where: attributeWhere, orderBy: { createdAt: 'desc' }, take: RECENT_LIMIT }),
      prisma.order.aggregate({
        _sum: { grandTotal: true },
        where: todayOrderWhere,
      }),
      prisma.order.aggregate({
        _sum: { grandTotal: true },
        where: monthOrderWhere,
      }),
      prisma.purchase.aggregate({
        _sum: { totalAmount: true },
        where: todayPurchaseWhere,
      }),
      prisma.purchase.aggregate({
        _sum: { totalAmount: true },
        where: monthPurchaseWhere,
      }),
      prisma.order.count({ where: todayOrderWhere }),
      prisma.order.count({ where: monthOrderWhere }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        where: storeCode ? { storeCode } : {},
        orderBy: { _sum: { quantity: 'desc' } },
        take: 6,
      }),
      prisma.orderItem.aggregate({
        _sum: { quantity: true },
        where: storeCode ? { storeCode } : {},
      })
    ]);

    const totalQuantity = totalQuantityResult._sum.quantity || 0;
    const productIds = topProductsByOrder.map(p => p.productId);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    });

    const productDistribution = topProductsByOrder.map(p => {
      const product = products.find(prod => prod.id === p.productId);
      const count = p._sum.quantity || 0;
      const stock = 0 || 0;
      const percentage = totalQuantity > 0 ? Math.round((count / totalQuantity) * 100) : 0;
      return {
        name: product?.name || 'Unknown Product',
        count,
        stock,
        percentage
      };
    });

    return {
      products: productRecent,
      attributes: attributeRecent,
      productTotal,
      attributeTotal,
      todaySale: todaySaleResult._sum.grandTotal || 0,
      totalMonthSale: monthSaleResult._sum.grandTotal || 0,
      todayPurchase: todayPurchaseResult._sum.totalAmount || 0,
      totalMonthPurchase: monthPurchaseResult._sum.totalAmount || 0,
      todayOrderCount,
      totalMonthOrderCount: monthOrderCount,
      productDistribution,
    };
  }
}
