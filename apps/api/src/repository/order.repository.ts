import { OrderStatus, Prisma } from "@prisma/client";
import prisma from "../config/prisma";

import { ListResponseDto, OrderDto, UpdateOrderDto, OrderFilterParams, TaxCategoryEnum, TaxTypeEnum } from '@pms/types';
import { IOrderRepository } from "./interfaces/iorder.repository";
import { effectiveOn, EFFECTIVE_ORDER } from "../utils/variant-pricing";

const SORTABLE_COLUMNS = new Set(['orderNumber', 'grandTotal', 'status', 'createdAt', 'updatedAt', 'id']);

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Order items snapshot only the money charged, so the GST on a line is not stored anywhere.
 * It is resolved here from the price row that was in force on the order date - the very row
 * order.service priced the sale from - rather than from today's rate, so a later rate change
 * cannot rewrite what an old bill says. Prices are tax-inclusive, so the tax is carved out of
 * the line rather than added to it, and the per-line figures always re-add to the order's own
 * stored `tax`.
 */
async function decorateWithTax<T extends OrderDto | null>(order: T): Promise<T> {
  if (!order || !order.items || order.items.length === 0) return order;

  const variantIds = [...new Set(order.items.map((item) => item.variantId).filter((id): id is number => id != null))];
  if (variantIds.length === 0) return order;

  const priceRows = await prisma.priceHistory.findMany({
    where: { variantId: { in: variantIds }, ...effectiveOn(new Date(order.orderDate)) },
    orderBy: EFFECTIVE_ORDER,
    select: { variantId: true, saleTaxType: true, taxId: true },
  });

  const priceByVariant = new Map<number, (typeof priceRows)[number]>();
  for (const row of priceRows) if (!priceByVariant.has(row.variantId)) priceByVariant.set(row.variantId, row);

  const taxIds = [...new Set([...priceByVariant.values()].map((row) => row.taxId).filter((id): id is string => id != null))];
  const taxes = taxIds.length > 0 ? await prisma.tax.findMany({ where: { id: { in: taxIds } }, select: { id: true, name: true, rate: true, category: true } }) : [];
  const taxById = new Map(taxes.map((tax) => [tax.id, tax] as const));

  for (const item of order.items) {
    const priceRow = item.variantId != null ? priceByVariant.get(item.variantId) : undefined;
    const tax = priceRow?.taxId ? taxById.get(priceRow.taxId) : undefined;
    // An exempt or zero-rated line carries no GST however the price was typed.
    const rate = tax && tax.category === TaxCategoryEnum.Taxable ? tax.rate.toNumber() : 0;
    const lineTotal = Number(item.totalPrice ?? item.unitPrice * item.quantity);

    if (rate <= 0 || priceRow?.saleTaxType !== TaxTypeEnum.WithTax) {
      item.taxName = tax?.name ?? null;
      item.taxRate = rate;
      item.taxableAmount = round2(lineTotal);
      item.taxAmount = 0;
      continue;
    }

    const taxAmount = round2((lineTotal * rate) / (100 + rate));
    item.taxName = tax?.name ?? null;
    item.taxRate = rate;
    item.taxAmount = taxAmount;
    item.taxableAmount = round2(lineTotal - taxAmount);
  }

  const totalTax = round2(Number(order.tax ?? 0));
  const cgst = round2(totalTax / 2);
  order.taxableAmount = round2(Number(order.totalAmount ?? 0) - totalTax);
  order.cgstAmount = cgst;
  order.sgstAmount = round2(totalTax - cgst);
  order.igstAmount = 0;

  return order;
}

export class OrderRepository implements IOrderRepository {
  async findAll(filters?: OrderFilterParams): Promise<ListResponseDto<OrderDto>> {
    const where: Prisma.orderWhereInput = {};
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.recordPerPage && filters.recordPerPage > 0 ? filters.recordPerPage : 10;

    if (filters) {
      if (filters.customerId) {
        where.customerId = filters.customerId;
      }
      if (filters.storeId) {
        where.store = { id: filters.storeId };
      }
      if (filters.storeCode) {
        where.storeCode = filters.storeCode;
      }
      if (filters.status) {
        where.status = filters.status as OrderStatus;
      }

      // The order number is what staff read off a bill; the customer columns are what they
      // are asked for on the phone, so both answer the one search box.
      if (filters.search) {
        where.OR = [
          { orderNumber: { contains: filters.search, mode: 'insensitive' } },
          { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
          { customer: { email: { contains: filters.search, mode: 'insensitive' } } },
          { customer: { phone: { contains: filters.search, mode: 'insensitive' } } },
        ];
      }

      if (filters.startDate != null || filters.endDate != null) {
        where.createdAt = {
          ...(filters.startDate != null && { gte: new Date(filters.startDate) }),
          ...(filters.endDate != null && { lte: new Date(filters.endDate) }),
        };
      }
    }

    const column = filters?.sortBy && SORTABLE_COLUMNS.has(filters.sortBy) ? filters.sortBy : 'createdAt';
    const direction: Prisma.SortOrder = filters?.sortDirection === 'asc' ? 'asc' : 'desc';
    const showAll = filters?.showAllRecords === true;

    const [data, totalRecord] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: [{ [column]: direction }, { id: 'desc' }],
        ...(showAll ? {} : { skip: (page - 1) * limit, take: limit }),
        include: {
          // A narrow select, never `customer: true`: the full users row would serialize the
          // customer's password hash and live session tokens into every order response.
          customer: { select: { id: true, userId: true, name: true, email: true, phone: true } },
          store: true,
          items: {
            include: {
              product: true,
            },
          },
          // Newest first so payments[0] is how the order was ultimately paid.
          payments: { select: { method: true, status: true, amount: true }, orderBy: { paymentDate: 'desc' } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { totalRecord, data };
  }

  async findByCustomerId(customerId: string): Promise<OrderDto[]> {
    return prisma.order.findMany({
      where: { customerId },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: { select: { id: true, userId: true, name: true, email: true, phone: true } },
        store: true,
        items: {
          include: {
            product: true,
          },
        },
        payments: { select: { method: true, status: true, amount: true }, orderBy: { paymentDate: 'desc' } },
      },
    });
  }

  async findById(id: number): Promise<OrderDto | null> {
    return decorateWithTax(await prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, userId: true, name: true, email: true, phone: true } },
        store: true,
        items: {
          include: {
            product: true,
            variant: { select: { id: true, name: true, sku: true, images: true } },
          },
        },
        payments: { select: { method: true, status: true, amount: true }, orderBy: { paymentDate: 'desc' } },
      },
    }));
  }

  async findByNumber(orderNumber: string): Promise<OrderDto | null> {
    return decorateWithTax(await prisma.order.findFirst({
      where: { orderNumber: { equals: orderNumber, mode: 'insensitive' } },
      include: {
        customer: { select: { id: true, userId: true, name: true, email: true, phone: true } },
        store: true,
        items: {
          include: {
            product: true,
            variant: { select: { id: true, name: true, sku: true, images: true } },
          },
        },
        payments: { select: { method: true, status: true, amount: true }, orderBy: { paymentDate: 'desc' } },
      },
    }));
  }

  async findByPublicToken(publicToken: string): Promise<OrderDto | null> {
    return decorateWithTax(await prisma.order.findFirst({
      where: { publicToken },
      include: {
        customer: { select: { id: true, userId: true, name: true, email: true, phone: true } },
        store: true,
        items: {
          include: {
            product: true,
            variant: { select: { id: true, name: true, sku: true, images: true } },
          },
        },
        payments: { select: { method: true, status: true, amount: true }, orderBy: { paymentDate: 'desc' } },
      },
    }));
  }

  async ensurePublicToken(id: number, token: string): Promise<string> {
    const existing = await prisma.order.findUnique({ where: { id }, select: { publicToken: true } });
    if (existing?.publicToken) return existing.publicToken;
    const updated = await prisma.order.update({ where: { id }, data: { publicToken: token }, select: { publicToken: true } });
    return updated.publicToken as string;
  }

  async update(id: number, data: UpdateOrderDto): Promise<OrderDto> {
    return prisma.order.update({ where: { id }, data });
  }

  async updateStatus(id: number, status: OrderStatus): Promise<OrderDto> {
    return prisma.order.update({ where: { id }, data: { status } });
  }

  async delete(id: number): Promise<OrderDto> {
    return prisma.order.delete({ where: { id } });
  }
}
