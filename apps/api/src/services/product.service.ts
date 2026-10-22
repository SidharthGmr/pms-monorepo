
import { Prisma } from "@prisma/client";
import { inject, injectable } from "inversify";

import { TYPES } from "../config/ioc.types";
import { ListResponseDto, ProductModel, ProductResponseDto, ProductVariantInlineModel, StatusEnum, LowStockItemDto, ProductFilterParams } from '@pms/types';
import NotFoundError from "../exceptions/not-found-error";

import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { pricesForVariants, stockForVariants } from "../utils/variant-pricing";
import { resolveVariantSku, resolveVariantSlug } from "../utils/variant-sku";
import { IProductService } from "./interfaces/Iproduct.service";





@injectable()
export class ProductService implements IProductService {
  constructor(
    @inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork
  ) { }




  async getAll(filters?: ProductFilterParams) {
    return this.unitOfWork.Product.findAll(filters, filters?.page, filters?.recordPerPage, filters?.sortBy, filters?.sortOrder);
  }

  async getById(id: number): Promise<ProductResponseDto | null> {
    const product = await this.unitOfWork.Product.findById(id);
    if (!product) throw new NotFoundError("Product not found");
    return product;
  }

  async getLowStock(storeCode: string, limit?: number): Promise<ListResponseDto<LowStockItemDto>> {
    return this.unitOfWork.Product.findLowStock(storeCode, limit);
  }

  async delete(id: number, userId: string,): Promise<ProductResponseDto> {
    const existing = await this.unitOfWork.Product.findById(id);
    if (!existing) throw new NotFoundError("Product not found");
    return this.unitOfWork.Product.delete(id, userId);
  }

  // Values of the picked MasterEntries ("RED", "M"), batched once for every row in a payload.
  private async entryValuesFor(
    transactionClient: Prisma.TransactionClient,
    storeCode: string,
    variants: ProductVariantInlineModel[]
  ): Promise<Map<number, string>> {
    const valueIds = Array.from(new Set(variants.flatMap((inline) => (inline.attributes ?? []).map((row) => row.attributeValueId))));
    if (valueIds.length === 0) return new Map();
    const entryRows = await transactionClient.masterEntry.findMany({ where: { id: { in: valueIds }, storeCode }, select: { id: true, value: true } });
    return new Map(entryRows.map((row) => [row.id, row.value]));
  }

  private variantNameFor(productName: string, attributes: { attributeValueId: number }[], entryValueById: Map<number, string>): string {
    const optionValues = attributes.map((row) => entryValueById.get(row.attributeValueId)).filter((value): value is string => !!value);
    return optionValues.length ? `${productName} - ${optionValues.join(" / ")}` : productName;
  }

  private async createInlineVariant(
    transactionClient: Prisma.TransactionClient,
    inline: ProductVariantInlineModel,
    context: {
      productId: number;
      productName: string;
      description: string;
      images: string[];
      status: string;
      storeCode: string;
      userId: string;
      entryValueById: Map<number, string>;
    }
  ): Promise<void> {
    const { productId, productName, storeCode, userId } = context;
    const attributes = inline.attributes ?? [];
    const variantName = this.variantNameFor(productName, attributes, context.entryValueById);
    const sku = await resolveVariantSku(transactionClient, { storeCode, productId, attributes });
    const slug = await resolveVariantSlug(transactionClient, { storeCode, name: variantName });

    const variantData = await transactionClient.productVariant.create({
      data: {
        productId,
        storeCode,
        createdById: userId,
        sku,
        slug,
        name: variantName,
        description: context.description,
        attributes: attributes as any,
        images: context.images,
        isActive: inline.isActive ?? true,
        isOffer: inline.isOffer ?? false,
        status: context.status as any,
      },
      select: { id: true },
    });

    if (inline.sellingPrice != null) {
      await this.unitOfWork.PriceHistory.create(
        {
          variantId: variantData.id,
          storeCode,
          sellingPrice: inline.sellingPrice,
          costPrice: inline.costPrice ?? null,
          offerPrice: inline.offerPrice ?? null,
          compareAtPrice: inline.compareAtPrice ?? null,
          effectiveFrom: inline.effectiveFrom ? new Date(inline.effectiveFrom) : new Date(),
          ...(inline.effectiveTo != null && { effectiveTo: new Date(inline.effectiveTo) }),
          reason: "Created with product",
          createdById: userId,
        },
        transactionClient
      );
    }

    if (inline.stockQuantity != null && inline.stockQuantity !== 0) {
      await transactionClient.stockHistory.create({
        data: { productId, variantId: variantData.id, storeCode, createdById: userId, quantity: inline.stockQuantity, reason: "Opening stock" },
      });
    }
  }

  async create(data: ProductModel, userId: string, storeCode: string): Promise<ProductResponseDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      const productData = await transactionClient.product.create({
        data: {
          storeCode: storeCode,
          createdById: userId,
          name: data.name,
          brandNameId: data.brandNameId || null,
          attributeId: data.attributeId || null,
          parentId: data.parentId || null,
          categoryId: data.categoryId,
          slug: data.slug,
          description: data.description || null,
          status: data.status || StatusEnum.Published,
          metadata: { ...data } as any,
          ...(data.images !== undefined && { images: data.images }),
          ...(data.displayOrder != null && { displayOrder: data.displayOrder }),
        },
      });

      // A product is only sellable through a variant, so creation always writes at least one -
      // the rows the caller sent, or a default derived from the product itself - together with
      // each variant's opening price (a PriceHistory row) and opening stock, all on this
      // transaction so a failed ledger write rolls the product back too.
      const inlineVariants: ProductVariantInlineModel[] =
        data.variants && data.variants.length > 0
          ? data.variants
          : [{ sellingPrice: data.sellingPrice as number, costPrice: data.costPrice ?? null, stockQuantity: data.stock ?? null }];

      // The caller only picks option values and a price; each variant's name ("Shirt - Red / M"),
      // SKU and slug are derived here, so resolve the picked entry values once for all rows.
      const entryValueById = await this.entryValuesFor(transactionClient, storeCode, inlineVariants);
      for (const inline of inlineVariants) {
        await this.createInlineVariant(transactionClient, inline, {
          productId: productData.id,
          productName: data.name,
          description: data.description || data.name,
          images: data.images ?? [],
          status: (data.status || StatusEnum.Published) as string,
          storeCode,
          userId,
          entryValueById,
        });
      }

      return productData;
    });
  }

  async update(id: number, data: ProductModel, userId: string, storeCode: string): Promise<ProductResponseDto> {
    const existing = await this.unitOfWork.Product.findById(id);
    if (!existing) throw new NotFoundError("Product not found");
    return this.unitOfWork.transaction(async (transactionClient) => {
      const updateData: any = {
        name: data.name,
        brandNameId: data.brandNameId || null,
        attributeId: data.attributeId || null,
        slug: data.slug,
        description: data.description || null,
        categoryId: data.categoryId,
        status: data.status,
        // Re-publishing a trashed product must clear the soft-delete markers, or the row is
        // left Published *and* deletedAt-set - a state every `deletedAt: null` guard rejects
        // (which is how a live product started failing "Product not found in this store").
        ...(data.status !== StatusEnum.Trash && { deletedAt: null, deletedById: null }),
        updatedById: userId,
        updatedAt: new Date(),
      };

      if (data.images !== undefined) {
        updateData.images = data.images;
      }

      const productData = await transactionClient.product.update({
        where: { id: id },
        data: updateData,
      });

      // The edit form sends the same variant rows as create. A row with an id updates that
      // variant: changed options re-derive the name (the SKU stays - it is on orders), a
      // changed price appends a ledger row, a changed stock figure books an adjustment. Rows
      // without an id become new variants; rows left out are untouched - deleting a variant
      // stays on the variants page.
      const inlineVariants = data.variants ?? [];
      if (inlineVariants.length > 0) {
        const productName = data.name || existing.name;
        const entryValueById = await this.entryValuesFor(transactionClient, storeCode, inlineVariants);
        const updateIds = inlineVariants.filter((inline) => inline.id != null).map((inline) => inline.id as number);
        const [currentRows, currentPrices, currentStock] = await Promise.all([
          transactionClient.productVariant.findMany({
            where: { id: { in: updateIds }, productId: id, storeCode, deletedAt: null },
            select: { id: true, attributes: true, isOffer: true },
          }),
          pricesForVariants(updateIds, new Date(), transactionClient),
          stockForVariants(updateIds, transactionClient),
        ]);
        const currentById = new Map(currentRows.map((row) => [row.id, row]));

        for (const inline of inlineVariants) {
          if (inline.id == null) {
            await this.createInlineVariant(transactionClient, inline, {
              productId: id,
              productName,
              description: data.description || productName,
              images: data.images ?? existing.images ?? [],
              status: (data.status || StatusEnum.Published) as string,
              storeCode,
              userId,
              entryValueById,
            });
            continue;
          }

          const current = currentById.get(inline.id);
          if (!current) throw new NotFoundError("Variant not found on this product");

          const attributes = inline.attributes ?? [];
          const attributesChanged = inline.attributes !== undefined && JSON.stringify(attributes) !== JSON.stringify(current.attributes ?? []);
          const offerFlagChanged = inline.isOffer !== undefined && inline.isOffer !== current.isOffer;
          if (attributesChanged || offerFlagChanged) {
            await transactionClient.productVariant.update({
              where: { id: inline.id },
              data: {
                ...(attributesChanged && { attributes: attributes as any, name: this.variantNameFor(productName, attributes, entryValueById) }),
                ...(offerFlagChanged && { isOffer: inline.isOffer }),
                updatedById: userId,
                updatedAt: new Date(),
              },
            });
          }

          const price = currentPrices.get(inline.id);
          const sameInstant = (a: Date | null | undefined, b: Date | null | undefined) => (a?.getTime() ?? null) === (b?.getTime() ?? null);
          const priceChanged =
            inline.sellingPrice != null &&
            (!price ||
              price.sellingPrice !== inline.sellingPrice ||
              (price.offerPrice ?? null) !== (inline.offerPrice ?? null) ||
              (price.costPrice ?? null) !== (inline.costPrice ?? null) ||
              (inline.effectiveFrom != null && !sameInstant(new Date(inline.effectiveFrom), price.effectiveFrom)) ||
              (inline.effectiveTo !== undefined && !sameInstant(inline.effectiveTo == null ? null : new Date(inline.effectiveTo), price.effectiveTo)));
          if (priceChanged) {
            await this.unitOfWork.PriceHistory.create(
              {
                variantId: inline.id,
                storeCode,
                sellingPrice: inline.sellingPrice as number,
                costPrice: inline.costPrice ?? null,
                offerPrice: inline.offerPrice ?? null,
                compareAtPrice: inline.compareAtPrice ?? null,
                effectiveFrom: inline.effectiveFrom ? new Date(inline.effectiveFrom) : new Date(),
                ...(inline.effectiveTo != null && { effectiveTo: new Date(inline.effectiveTo) }),
                reason: "Updated with product",
                createdById: userId,
              },
              transactionClient
            );
          }

          const onHand = currentStock.get(inline.id) ?? 0;
          if (inline.stockQuantity != null && inline.stockQuantity !== onHand) {
            await transactionClient.stockHistory.create({
              data: {
                productId: id,
                variantId: inline.id,
                storeCode,
                createdById: userId,
                quantity: inline.stockQuantity - onHand,
                reason: "Adjusted with product",
              },
            });
          }
        }
      }


      return productData;
    });
  }

}
