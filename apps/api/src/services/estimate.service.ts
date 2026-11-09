import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import {
  computeEstimateTotals,
  ESTIMATE_STATUS_TRANSITIONS,
  EstimateDto,
  EstimateFilterParams,
  EstimateLineInput,
  EstimateModel,
  EstimateStatus,
  EstimateStatusEnum,
  EstimateStatusModel,
  EstimateTotals,
  ListResponseDto,
  PublicDocumentDto,
  ShareLinkDto,
  TaxCategoryEnum,
  EstimateConvertModel,
  OrderDto,
  OrderStatusEnum,
  TaxType,
  TaxTypeEnum,
} from '@pms/types';
import { Prisma } from '@prisma/client';
import ClientError from '../exceptions/client-error';
import ForbiddenError from '../exceptions/forbidden-error';
import NotFoundError from '../exceptions/not-found-error';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { toPublicEstimate } from '../utils/public-document';
import { buildShareUrl, generateShareToken } from '../utils/share-token';
import { discountedUnitPrice } from '../utils/variant-pricing';
import { IEstimateService } from './interfaces/Iestimate.service';
import type { IOrderService } from './interfaces/Iorder.service';

type EstimateItemRow = Omit<Prisma.estimateItemCreateManyEstimateInput, 'estimateId'>;

/**
 * How far a converted sale's total may sit from the quoted total before the conversion is
 * refused. Spreading a line total back over its quantity can leave a few paisa; anything
 * larger means the two documents genuinely disagree about the money.
 */
const MAX_CONVERSION_DRIFT = 1;

const round2 = (value: number) => Math.round(value * 100) / 100;

@injectable()
export class EstimateService implements IEstimateService {
  // The order service is injected directly rather than through IUnitOfService: the aggregator
  // holds this service too, so going through it would make resolving either one recurse.
  constructor(
    @inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork,
    @inject(TYPES.IOrderService) private orderService: IOrderService
  ) {}

  async create(data: EstimateModel, storeCode: string, createdById: string): Promise<EstimateDto> {
    const estimateDate = data.estimateDate ? new Date(data.estimateDate) : new Date();
    const status = data.status === EstimateStatusEnum.Sent ? EstimateStatusEnum.Sent : EstimateStatusEnum.Draft;

    // Two concurrent creates can draw the same per-store number; the unique constraint
    // rejects one and a single retry draws the next number.
    let created: { id: number } | null = null;
    for (let attempt = 0; created === null; attempt++) {
      try {
        created = await this.unitOfWork.transaction(async (transactionClient) => {
          const { itemRows, totals } = await this.buildItems(data, storeCode, estimateDate, transactionClient);
          const estimateNumber = await this.nextEstimateNumber(storeCode, transactionClient);

          const estimateData = await transactionClient.estimate.create({
            data: {
              estimateNumber,
              storeCode,
              ...this.headerFields(data, estimateDate),
              status,
              ...this.totalFields(totals, data),
              createdById,
              items: { createMany: { data: itemRows } },
              statusHistory: { create: { toStatus: status, changedById: createdById } },
            },
            select: { id: true },
          });
          return estimateData;
        });
      } catch (error) {
        if (attempt === 0 && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') continue;
        throw error;
      }
    }

    const estimate = await this.unitOfWork.Estimate.findById(created.id);
    return estimate!;
  }

  async getAll(filters?: EstimateFilterParams): Promise<ListResponseDto<EstimateDto>> {
    const sortOrder = filters?.sortDirection?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    return this.unitOfWork.Estimate.findAll(filters, filters?.page, filters?.recordPerPage, filters?.sortBy ?? undefined, sortOrder);
  }

  async getById(id: number, storeCode?: string): Promise<EstimateDto | null> {
    const estimate = await this.unitOfWork.Estimate.findById(id);
    if (!estimate) throw new NotFoundError('Estimate not found');
    if (storeCode && estimate.storeCode !== storeCode) throw new ForbiddenError('This estimate belongs to another store');
    return estimate;
  }

  // The lookup is scoped by storeCode (the number is only unique per store), so another
  // store's number simply reads as not found rather than leaking across tenants.
  async getByNumber(estimateNumber: string, storeCode: string): Promise<EstimateDto | null> {
    const estimate = await this.unitOfWork.Estimate.findByNumber(storeCode, estimateNumber);
    if (!estimate) throw new NotFoundError('Estimate not found');
    return estimate;
  }

  async update(id: number, data: EstimateModel, storeCode: string, updatedById: string): Promise<EstimateDto> {
    const existing = await this.unitOfWork.Estimate.findById(id);
    if (!existing) throw new NotFoundError('Estimate not found');
    if (existing.storeCode !== storeCode) throw new ForbiddenError('This estimate belongs to another store');
    if (existing.status !== EstimateStatusEnum.Draft) throw new ClientError('Only draft estimates can be edited');

    const estimateDate = data.estimateDate ? new Date(data.estimateDate) : new Date(existing.estimateDate);

    await this.unitOfWork.transaction(async (transactionClient) => {
      const { itemRows, totals } = await this.buildItems(data, storeCode, estimateDate, transactionClient);
      await transactionClient.estimateItem.deleteMany({ where: { estimateId: id } });
      return transactionClient.estimate.update({
        where: { id },
        data: {
          ...this.headerFields(data, estimateDate),
          ...this.totalFields(totals, data),
          updatedById,
          updatedAt: new Date(),
          items: { createMany: { data: itemRows } },
        },
        select: { id: true },
      });
    });

    const estimate = await this.unitOfWork.Estimate.findById(id);
    return estimate!;
  }

  async delete(id: number, storeCode: string): Promise<EstimateDto> {
    const existing = await this.unitOfWork.Estimate.findById(id);
    if (!existing) throw new NotFoundError('Estimate not found');
    if (existing.storeCode !== storeCode) throw new ForbiddenError('This estimate belongs to another store');
    if (existing.status !== EstimateStatusEnum.Draft && existing.status !== EstimateStatusEnum.Cancelled) {
      throw new ClientError('Only draft or cancelled estimates can be deleted');
    }
    return this.unitOfWork.Estimate.delete(id);
  }

  async updateStatus(id: number, data: EstimateStatusModel, storeCode: string, changedById: string): Promise<EstimateDto> {
    const existing = await this.unitOfWork.Estimate.findById(id);
    if (!existing) throw new NotFoundError('Estimate not found');
    if (existing.storeCode !== storeCode) throw new ForbiddenError('This estimate belongs to another store');
    if (existing.status === data.status) return existing;

    const allowed = ESTIMATE_STATUS_TRANSITIONS[existing.status as EstimateStatus] ?? [];
    if (!allowed.includes(data.status)) {
      throw new ClientError(`An estimate cannot move from ${existing.status} to ${data.status}`);
    }

    // Lazy expiry: accepting past the validity date flips the estimate to EXPIRED instead,
    // so the stored status catches up with what every screen already displays.
    const lapsed = existing.validUntil != null && new Date(existing.validUntil).getTime() < Date.now();
    if (lapsed && data.status === EstimateStatusEnum.Accepted) {
      await this.transitionTo(id, existing.status, EstimateStatusEnum.Expired, 'Validity date passed', changedById);
      throw new ClientError('This estimate has expired; extend its validity before accepting it.');
    }

    await this.transitionTo(id, existing.status, data.status, data.note ?? null, changedById);
    const estimate = await this.unitOfWork.Estimate.findById(id);
    return estimate!;
  }

  /**
   * Turns an accepted quotation into a real sale. The order is priced from the estimate rather
   * than from today's price ledger - a quote whose price moved on conversion would not be a
   * quote - and the override reaches the order service from the stored estimate row, never from
   * the request, so this does not become a way for a caller to name its own price.
   *
   * The order and the estimate's CONVERTED status commit together: if stock is short the whole
   * conversion rolls back and the estimate is left untouched rather than half-converted.
   */
  async convert(id: number, data: EstimateConvertModel, storeCode: string, convertedById: string, convertedByName: string): Promise<OrderDto> {
    const estimate = await this.unitOfWork.Estimate.findById(id);
    if (!estimate) throw new NotFoundError('Estimate not found');
    if (estimate.storeCode !== storeCode) throw new ForbiddenError('This estimate belongs to another store');
    if (estimate.convertedOrderId != null) throw new ClientError(`This estimate was already converted to order #${estimate.convertedOrderId}`);

    const allowed = ESTIMATE_STATUS_TRANSITIONS[estimate.status as EstimateStatus] ?? [];
    if (!allowed.includes(EstimateStatusEnum.Converted)) {
      throw new ClientError(
        estimate.status === EstimateStatusEnum.Sent
          ? 'Mark this estimate accepted before converting it to a sale'
          : `An estimate that is ${estimate.status.toLowerCase()} cannot be converted to a sale`
      );
    }
    if (!estimate.customerId) {
      throw new ClientError('This estimate has no linked customer account, so it cannot become an order. Edit it and pick a registered customer.');
    }

    const items = estimate.items ?? [];
    if (items.length === 0) throw new ClientError('This estimate has no items to convert');

    // The line total is what the customer was quoted for that line - after its discount and
    // with the GST inside it, which is the convention order prices already follow.
    const orderItems = items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
      unitPriceOverride: Math.round((item.lineTotal / item.quantity) * 100) / 100,
    }));

    // The order has no adjustment of its own, and an adjustment is just money added to or
    // taken off the total - so it is carried on whichever of the two order-level amounts moves
    // the total the same way, which reproduces the quoted grand total exactly.
    const adjustment = estimate.adjustment ?? 0;
    const discount = round2(estimate.additionalDiscount + Math.max(0, -adjustment));
    const shippingCost = round2(estimate.shippingCharges + Math.max(0, adjustment));

    const noteParts = [`Converted from estimate ${estimate.estimateNumber}`];
    if (adjustment !== 0) noteParts.push(`includes an adjustment of ${adjustment.toFixed(2)}`);
    if (data.notes) noteParts.push(data.notes);

    const order = await this.unitOfWork.transaction(async (transactionClient) => {
      const created = await this.orderService.create(
        {
          customerId: estimate.customerId!,
          orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
          discount,
          shippingCost,
          status: data.status === OrderStatusEnum.Pending ? OrderStatusEnum.Pending : OrderStatusEnum.Confirmed,
          notes: noteParts.join(' - '),
          items: orderItems,
        },
        storeCode,
        convertedById,
        convertedByName,
        transactionClient
      );

      // A quoted total the sale does not reproduce means the two documents disagree about what
      // the customer owes, so the conversion is abandoned rather than left to be noticed later.
      if (Math.abs(created.grandTotal - estimate.grandTotal) > MAX_CONVERSION_DRIFT) {
        throw new ClientError(
          `The sale total (${created.grandTotal.toFixed(2)}) does not match the quoted total (${estimate.grandTotal.toFixed(2)}). The estimate was not converted.`
        );
      }

      await transactionClient.estimate.update({
        where: { id },
        data: {
          status: EstimateStatusEnum.Converted,
          convertedOrderId: created.id,
          convertedAt: new Date(),
          updatedById: convertedById,
          statusHistory: {
            create: {
              fromStatus: estimate.status as EstimateStatus,
              toStatus: EstimateStatusEnum.Converted,
              note: `Converted to order ${created.orderNumber}`,
              changedById: convertedById,
            },
          },
        },
      });

      return created;
    });

    return order;
  }

  /** A new DRAFT carrying the source's snapshots untouched - prices are NOT re-read from the ledger. */
  async duplicate(id: number, storeCode: string, createdById: string): Promise<EstimateDto> {
    const source = await this.unitOfWork.Estimate.findById(id);
    if (!source) throw new NotFoundError('Estimate not found');
    if (source.storeCode !== storeCode) throw new ForbiddenError('This estimate belongs to another store');

    const estimateDate = new Date();
    const validityMs =
      source.validUntil != null ? new Date(source.validUntil).getTime() - new Date(source.estimateDate).getTime() : null;
    const validUntil = validityMs != null && validityMs > 0 ? new Date(estimateDate.getTime() + validityMs) : null;

    let created: { id: number } | null = null;
    for (let attempt = 0; created === null; attempt++) {
      try {
        created = await this.unitOfWork.transaction(async (transactionClient) => {
          const estimateNumber = await this.nextEstimateNumber(storeCode, transactionClient);
          const estimateData = await transactionClient.estimate.create({
            data: {
              estimateNumber,
              storeCode,
              customerId: source.customerId ?? null,
              customerName: source.customerName,
              customerPhone: source.customerPhone ?? null,
              customerEmail: source.customerEmail ?? null,
              billingAddress: source.billingAddress ?? null,
              shippingAddress: source.shippingAddress ?? null,
              estimateDate,
              validUntil,
              referenceNumber: source.referenceNumber ?? null,
              notes: source.notes ?? null,
              terms: source.terms ?? null,
              status: EstimateStatusEnum.Draft,
              subtotal: source.subtotal,
              itemDiscountTotal: source.itemDiscountTotal,
              additionalDiscountType: source.additionalDiscountType ?? null,
              additionalDiscountValue: source.additionalDiscountValue ?? null,
              additionalDiscount: source.additionalDiscount,
              taxableAmount: source.taxableAmount,
              cgstAmount: source.cgstAmount,
              sgstAmount: source.sgstAmount,
              igstAmount: source.igstAmount,
              taxAmount: source.taxAmount,
              shippingCharges: source.shippingCharges,
              adjustment: source.adjustment,
              grandTotal: source.grandTotal,
              isInterState: source.isInterState,
              createdById,
              items: {
                createMany: {
                  data: (source.items ?? []).map((item) => ({
                    storeCode,
                    productId: item.productId,
                    variantId: item.variantId,
                    productName: item.productName,
                    variantName: item.variantName ?? null,
                    sku: item.sku ?? null,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discountType: item.discountType ?? null,
                    discountValue: item.discountValue ?? null,
                    discountAmount: item.discountAmount,
                    taxId: item.taxId ?? null,
                    taxName: item.taxName ?? null,
                    taxRate: item.taxRate,
                    taxType: item.taxType ?? null,
                    taxableAmount: item.taxableAmount,
                    taxAmount: item.taxAmount,
                    lineTotal: item.lineTotal,
                  })),
                },
              },
              statusHistory: {
                create: { toStatus: EstimateStatusEnum.Draft, note: `Duplicated from ${source.estimateNumber}`, changedById: createdById },
              },
            },
            select: { id: true },
          });
          return estimateData;
        });
      } catch (error) {
        if (attempt === 0 && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') continue;
        throw error;
      }
    }

    const estimate = await this.unitOfWork.Estimate.findById(created.id);
    return estimate!;
  }

  async createShareLink(id: number, storeCode: string): Promise<ShareLinkDto> {
    const existing = await this.unitOfWork.Estimate.findById(id);
    if (!existing) throw new NotFoundError('Estimate not found');
    if (existing.storeCode !== storeCode) throw new ForbiddenError('This estimate belongs to another store');

    const token = await this.unitOfWork.Estimate.ensurePublicToken(id, generateShareToken());
    return { token, url: buildShareUrl('estimate', token) };
  }

  // The token in the URL is the only credential a recipient has, so a bad one must look
  // exactly like a document that does not exist.
  async getPublic(publicToken: string): Promise<PublicDocumentDto> {
    const estimate = await this.unitOfWork.Estimate.findByPublicToken(publicToken);
    if (!estimate) throw new NotFoundError('Document not found');
    return toPublicEstimate(estimate);
  }

  private async transitionTo(id: number, fromStatus: EstimateStatus, toStatus: EstimateStatus, note: string | null, changedById: string) {
    return this.unitOfWork.transaction(async (transactionClient) => {
      return transactionClient.estimate.update({
        where: { id },
        data: {
          status: toStatus,
          updatedById: changedById,
          updatedAt: new Date(),
          statusHistory: { create: { fromStatus, toStatus, note, changedById } },
        },
        select: { id: true },
      });
    });
  }

  private headerFields(data: EstimateModel, estimateDate: Date) {
    return {
      customerId: data.customerId || null,
      customerName: data.customerName,
      customerPhone: data.customerPhone || null,
      customerEmail: data.customerEmail || null,
      billingAddress: data.billingAddress || null,
      shippingAddress: data.shippingAddress || null,
      estimateDate,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      referenceNumber: data.referenceNumber || null,
      notes: data.notes || null,
      terms: data.terms || null,
      isInterState: data.isInterState === true,
    };
  }

  private totalFields(totals: EstimateTotals, data: EstimateModel) {
    return {
      subtotal: totals.subtotal,
      itemDiscountTotal: totals.itemDiscountTotal,
      additionalDiscountType: data.additionalDiscountType ?? null,
      additionalDiscountValue: data.additionalDiscountValue ?? null,
      additionalDiscount: totals.additionalDiscount,
      taxableAmount: totals.taxableAmount,
      cgstAmount: totals.cgstAmount,
      sgstAmount: totals.sgstAmount,
      igstAmount: totals.igstAmount,
      taxAmount: totals.taxAmount,
      shippingCharges: totals.shippingCharges,
      adjustment: totals.adjustment,
      grandTotal: totals.grandTotal,
    };
  }

  /**
   * Resolves every line into a frozen snapshot: the variant names it, the price ledger in
   * force on the estimate date prices it unless the caller overrides, and the tax rate is
   * copied onto the row so later rate changes never touch this estimate. Totals are
   * recomputed here regardless of what the client displayed.
   */
  private async buildItems(
    data: EstimateModel,
    storeCode: string,
    estimateDate: Date,
    transactionClient: Prisma.TransactionClient
  ): Promise<{ itemRows: EstimateItemRow[]; totals: EstimateTotals }> {
    const items = data.items ?? [];
    if (items.length === 0) throw new ClientError('Add at least one product');
    const variantIds = [...new Set(items.map((item) => item.variantId))];

    const [variants, prices] = await Promise.all([
      transactionClient.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: { select: { name: true } } },
      }),
      this.unitOfWork.PriceHistory.getEffectiveOnMany(variantIds, estimateDate, transactionClient),
    ]);
    const variantById = new Map(variants.map((variant) => [variant.id, variant] as const));

    const taxIds = [
      ...new Set(
        items
          .map((item) => (item.taxId !== undefined ? item.taxId : (prices.get(item.variantId)?.taxId ?? null)))
          .filter((taxId): taxId is string => !!taxId)
      ),
    ];
    const taxRows =
      taxIds.length > 0
        ? await transactionClient.tax.findMany({ where: { id: { in: taxIds } }, select: { id: true, name: true, rate: true, category: true } })
        : [];
    const taxById = new Map(taxRows.map((tax) => [tax.id, tax] as const));

    const itemRows: EstimateItemRow[] = [];
    const lineInputs: EstimateLineInput[] = [];

    for (const item of items) {
      const variant = variantById.get(item.variantId);
      if (!variant || variant.deletedAt) throw new NotFoundError(`Product variant with ID ${item.variantId} not found`);
      if (variant.storeCode !== storeCode) throw new ForbiddenError(`Product variant with ID ${item.variantId} does not belong to your store`);

      const label = `${variant.product.name}${variant.sku ? ` (${variant.sku})` : ''}`;
      const priceRow = prices.get(item.variantId);

      // The price being quoted decides which tax type applies: quoting the wholesale price
      // goes by the wholesale tax type, exactly as the sale itself will.
      const usedWholesale = variant.isOffer && priceRow?.wholesalePrice != null;
      let unitPrice = item.unitPrice ?? null;
      if (unitPrice == null && priceRow) {
        const base = usedWholesale ? priceRow.wholesalePrice! : priceRow.sellingPrice;
        unitPrice = discountedUnitPrice(base, priceRow.discountType, priceRow.discountValue);
      }
      if (unitPrice == null) {
        throw new ClientError(`No price found for ${label}. Enter a price or set one in the price ledger.`);
      }

      const taxId = item.taxId !== undefined ? item.taxId || null : (priceRow?.taxId ?? null);
      const tax = taxId ? taxById.get(taxId) : undefined;
      if (taxId && !tax) throw new ClientError(`Tax not found for ${label}`);
      const taxRate = tax && tax.category === TaxCategoryEnum.Taxable ? tax.rate.toNumber() : 0;
      const ledgerTaxType = usedWholesale ? priceRow?.wholesaleTaxType : priceRow?.saleTaxType;
      const taxType: TaxType | null = ledgerTaxType ?? (taxRate > 0 ? TaxTypeEnum.WithTax : null);

      const grossAmount = Math.round(unitPrice * item.quantity * 100) / 100;
      if (item.discountType === 'FLAT' && (item.discountValue ?? 0) > grossAmount) {
        throw new ClientError(`Discount cannot exceed the line amount for ${label}`);
      }

      lineInputs.push({
        quantity: item.quantity,
        unitPrice,
        discountType: item.discountType ?? null,
        discountValue: item.discountValue ?? null,
        taxRate,
        taxType,
      });
      itemRows.push({
        storeCode,
        productId: variant.productId,
        variantId: variant.id,
        productName: variant.product.name,
        variantName: variant.name,
        sku: variant.sku,
        quantity: item.quantity,
        unitPrice,
        discountType: item.discountType ?? null,
        discountValue: item.discountValue ?? null,
        taxId,
        taxName: tax?.name ?? null,
        taxRate,
        taxType,
      });
    }

    const totals = computeEstimateTotals(lineInputs, {
      additionalDiscountType: data.additionalDiscountType,
      additionalDiscountValue: data.additionalDiscountValue,
      shippingCharges: data.shippingCharges,
      adjustment: data.adjustment,
      isInterState: data.isInterState,
    });

    if (data.additionalDiscountType === 'FLAT' && (data.additionalDiscountValue ?? 0) > 0 && totals.additionalDiscount < (data.additionalDiscountValue ?? 0)) {
      throw new ClientError('The discount cannot be larger than the estimate total.');
    }
    if (totals.grandTotal < 0) throw new ClientError('The estimate total cannot be negative.');

    totals.lines.forEach((line, index) => {
      const row = itemRows[index]!;
      row.discountAmount = line.discountAmount;
      row.taxableAmount = line.taxableAmount;
      row.taxAmount = line.taxAmount;
      row.lineTotal = line.lineTotal;
    });

    return { itemRows, totals };
  }

  /** Sequential per store (EST-0001, EST-0002, ...); the unique index is the real guarantee. */
  private async nextEstimateNumber(storeCode: string, transactionClient: Prisma.TransactionClient): Promise<string> {
    const last = await transactionClient.estimate.findFirst({
      where: { storeCode },
      orderBy: { id: 'desc' },
      select: { estimateNumber: true },
    });
    const lastSequence = last ? Number(last.estimateNumber.match(/(\d+)$/)?.[1] ?? 0) : 0;
    return `EST-${String(lastSequence + 1).padStart(4, '0')}`;
  }
}
