import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { EstimateDto, EstimateFilterParams, EstimateItemDto, EstimateStatus, ListResponseDto } from '@pms/types';
import { IEstimateRepository } from './interfaces/iestimate.repository';

const SORTABLE_COLUMNS = new Set(['estimateNumber', 'customerName', 'estimateDate', 'validUntil', 'grandTotal', 'status', 'createdAt', 'updatedAt', 'id']);

const estimateSelect = {
  id: true,
  estimateNumber: true,
  storeCode: true,
  customerId: true,
  customerName: true,
  customerPhone: true,
  customerEmail: true,
  billingAddress: true,
  shippingAddress: true,
  estimateDate: true,
  validUntil: true,
  referenceNumber: true,
  notes: true,
  terms: true,
  status: true,
  subtotal: true,
  itemDiscountTotal: true,
  additionalDiscountType: true,
  additionalDiscountValue: true,
  additionalDiscount: true,
  taxableAmount: true,
  cgstAmount: true,
  sgstAmount: true,
  igstAmount: true,
  taxAmount: true,
  shippingCharges: true,
  adjustment: true,
  grandTotal: true,
  isInterState: true,
  convertedOrderId: true,
  convertedAt: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { name: true } },
} satisfies Prisma.estimateSelect;

const estimateItemSelect = {
  id: true,
  estimateId: true,
  productId: true,
  variantId: true,
  productName: true,
  variantName: true,
  sku: true,
  quantity: true,
  unitPrice: true,
  discountType: true,
  discountValue: true,
  discountAmount: true,
  taxId: true,
  taxName: true,
  taxRate: true,
  taxType: true,
  taxableAmount: true,
  taxAmount: true,
  lineTotal: true,
} satisfies Prisma.estimateItemSelect;

const estimateDetailSelect = {
  ...estimateSelect,
  items: { select: estimateItemSelect, orderBy: { id: 'asc' } },
  statusHistory: {
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      note: true,
      changedById: true,
      createdAt: true,
      changedBy: { select: { name: true } },
    },
    orderBy: { id: 'desc' },
  },
  store: { select: { name: true, code: true, address: true, phone: true, email: true, siteName: true, storeLogo: true } },
  convertedOrder: { select: { id: true, orderNumber: true } },
} satisfies Prisma.estimateSelect;

type EstimateRow = Prisma.estimateGetPayload<{ select: typeof estimateSelect }>;
type EstimateDetailRow = Prisma.estimateGetPayload<{ select: typeof estimateDetailSelect }>;
type EstimateItemRow = Prisma.estimateItemGetPayload<{ select: typeof estimateItemSelect }>;

const toNumber = (value: Prisma.Decimal) => value.toNumber();
const toNullableNumber = (value: Prisma.Decimal | null) => (value == null ? null : value.toNumber());

function toItemDto(row: EstimateItemRow): EstimateItemDto {
  return {
    ...row,
    unitPrice: toNumber(row.unitPrice),
    discountValue: toNullableNumber(row.discountValue),
    discountAmount: toNumber(row.discountAmount),
    taxRate: toNumber(row.taxRate),
    taxableAmount: toNumber(row.taxableAmount),
    taxAmount: toNumber(row.taxAmount),
    lineTotal: toNumber(row.lineTotal),
  };
}

function toDto(row: EstimateRow): EstimateDto {
  const { createdBy, ...rest } = row;
  return {
    ...rest,
    subtotal: toNumber(row.subtotal),
    itemDiscountTotal: toNumber(row.itemDiscountTotal),
    additionalDiscountValue: toNullableNumber(row.additionalDiscountValue),
    additionalDiscount: toNumber(row.additionalDiscount),
    taxableAmount: toNumber(row.taxableAmount),
    cgstAmount: toNumber(row.cgstAmount),
    sgstAmount: toNumber(row.sgstAmount),
    igstAmount: toNumber(row.igstAmount),
    taxAmount: toNumber(row.taxAmount),
    shippingCharges: toNumber(row.shippingCharges),
    adjustment: toNumber(row.adjustment),
    grandTotal: toNumber(row.grandTotal),
    createdByName: createdBy?.name ?? null,
  };
}

function toDetailDto(row: EstimateDetailRow): EstimateDto {
  const { items, statusHistory, store, convertedOrder, ...base } = row;
  return {
    ...toDto(base),
    items: items.map(toItemDto),
    statusHistory: statusHistory.map(({ changedBy, ...history }) => ({ ...history, changedByName: changedBy?.name ?? null })),
    store: store ?? undefined,
    convertedOrder: convertedOrder ?? null,
  };
}

export class EstimateRepository implements IEstimateRepository {
  async findAll(
    filters?: EstimateFilterParams,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<ListResponseDto<EstimateDto>> {
    const where: Prisma.estimateWhereInput = { deletedAt: null };

    if (filters) {
      page = filters.page ?? page;
      limit = filters.recordPerPage ?? limit;

      if (filters.search) {
        where.OR = [
          { estimateNumber: { contains: filters.search, mode: 'insensitive' } },
          { customerName: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
      if (filters.status !== undefined) {
        where.status = filters.status as EstimateStatus;
      }
      if (filters.customerId !== undefined) {
        where.customerId = filters.customerId;
      }
      if (filters.storeCode !== undefined) {
        where.storeCode = filters.storeCode;
      }
      if (filters.startDate != null || filters.endDate != null) {
        where.estimateDate = {
          ...(filters.startDate != null && { gte: new Date(filters.startDate) }),
          ...(filters.endDate != null && { lte: new Date(filters.endDate) }),
        };
      }
    }

    const showAll = filters?.showAllRecords === true;
    const skip = showAll ? undefined : (page - 1) * limit;
    const take = showAll ? undefined : limit;

    const column = SORTABLE_COLUMNS.has(sortBy) ? sortBy : 'createdAt';
    const direction: Prisma.SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.estimateOrderByWithRelationInput[] =
      column === 'validUntil' ? [{ validUntil: { sort: direction, nulls: 'last' } }, { id: 'desc' }] : [{ [column]: direction }, { id: 'desc' }];

    const [rows, total] = await Promise.all([
      prisma.estimate.findMany({
        where,
        select: estimateSelect,
        orderBy,
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
      }),
      prisma.estimate.count({ where }),
    ]);

    return { totalRecord: total, data: rows.map(toDto) };
  }

  async findById(id: number): Promise<EstimateDto | null> {
    const row = await prisma.estimate.findFirst({ where: { id, deletedAt: null }, select: estimateDetailSelect });
    return row ? toDetailDto(row) : null;
  }

  async findByNumber(storeCode: string, estimateNumber: string): Promise<EstimateDto | null> {
    const row = await prisma.estimate.findFirst({
      where: { storeCode, estimateNumber: { equals: estimateNumber, mode: 'insensitive' }, deletedAt: null },
      select: estimateDetailSelect,
    });
    return row ? toDetailDto(row) : null;
  }

  async findByPublicToken(publicToken: string): Promise<EstimateDto | null> {
    const row = await prisma.estimate.findFirst({ where: { publicToken, deletedAt: null }, select: estimateDetailSelect });
    return row ? toDetailDto(row) : null;
  }

  async ensurePublicToken(id: number, token: string): Promise<string> {
    const existing = await prisma.estimate.findUnique({ where: { id }, select: { publicToken: true } });
    if (existing?.publicToken) return existing.publicToken;
    const updated = await prisma.estimate.update({ where: { id }, data: { publicToken: token }, select: { publicToken: true } });
    return updated.publicToken as string;
  }

  async delete(id: number): Promise<EstimateDto> {
    const row = await prisma.estimate.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: estimateSelect,
    });
    return toDto(row);
  }
}
