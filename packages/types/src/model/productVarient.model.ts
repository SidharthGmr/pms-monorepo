import { Status } from "../enum/status.enum";

export interface ProductVariantModel {
  productId: number;
  storeCode: string;
  name: string;
  slug?: string;
  sku?: string;
  barcode?: string | null;
  attributes?: (attributesModelRow | undefined)[];
  description: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  images: string[];
  isActive: boolean;
  isOffer?: boolean;
  status: Status;
  isFeatured?: boolean;
  lowStockThreshold?: number | null;
  stockQuantity?: number | null;
  costPrice?: number | null;
  sellingPrice?: number | null;
  offerPrice?: number | null;
  compareAtPrice?: number | null;
  effectiveFrom?: Date;
  effectiveTo?: Date | null;
  reason?: string | null;
  createdById: string;
  updatedById?: string | null;
}

export interface attributesModelRow {
  attributeid: number | null;
  attributeValueId: number | null;
}


/**
 * What the client actually PUTs/POSTs for a variant.
 *
 * `ProductVariantModel` above describes the stored row, so it requires columns the
 * server derives itself - `storeCode` from the caller's token and `createdById`
 * from their user id. Sending them from the browser is at best ignored and at
 * worst a tenancy hole, so they are absent here.
 *
 * Dates are `string | Date` because JSON carries them as ISO strings and the
 * validator coerces (`z.coerce.date()`).
 */
export type ProductVariantCreateRequest = Omit<
  ProductVariantModel,
  'storeCode' | 'createdById' | 'updatedById' | 'images' | 'isActive' | 'status' | 'effectiveFrom' | 'effectiveTo'
> & {
  images?: string[];
  isActive?: boolean;
  status?: Status;
  effectiveFrom?: string | Date;
  effectiveTo?: string | Date | null;
  /** Ends the previously effective price period instead of leaving both open. */
  supersedePrevious?: boolean;
};

/** Same contract for an edit, where every field is optional except the ones being changed. */
export type ProductVariantUpdateRequest = Partial<Omit<ProductVariantCreateRequest, 'productId'>>;
