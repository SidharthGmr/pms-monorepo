/**
 * The public catalog read model: a product card with its sellable variants, every derived
 * number (payable price, stock, resolved attribute values) already computed server-side so
 * the storefront renders without further lookups. Read-only - nothing here is a write shape.
 */

export interface CatalogVariantAttributeDto {
  attributeId: number;
  attributeName: string;
  entryId: number;
  value: string;
  colorHex: string | null;
}

export interface CatalogVariantDto {
  id: number;
  name: string;
  slug: string;
  sku: string;
  images: string[];
  isOffer: boolean;
  stock: number;
  inStock: boolean;
  sellingPrice: number | null;
  offerPrice: number | null;
  compareAtPrice: number | null;
  /** What the customer pays now: the offer price while `isOffer` is on, else the selling price. */
  payablePrice: number | null;
  attributes: CatalogVariantAttributeDto[];
}

export interface CatalogProductDto {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  /** Only the detail endpoint fills this; list responses leave it out to stay small. */
  description?: string | null;
  /** Seller card for the detail page; the list leaves it out. Contact fields only, never codes. */
  store?: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  images: string[];
  isFeatured: boolean;
  categoryId: number;
  categoryName: string;
  brandNameId: number | null;
  brandName: string | null;
  /** Payable-price range across the variants that matched the filter. */
  minPrice: number | null;
  maxPrice: number | null;
  /** Averaged from the product's Published reviews - ratings live on the product, not variants. */
  rating: number | null;
  ratingCount: number;
  /** Only the variants that matched the filter; `totalVariants` says how many exist in all. */
  variants: CatalogVariantDto[];
  totalVariants: number;
  createdAt: Date | string;
}

export interface CatalogFacetCountDto {
  id: number;
  name: string;
  count: number;
}

export interface CatalogFacetEntryDto {
  id: number;
  value: string;
  colorHex: string | null;
  count: number;
}

export interface CatalogFacetAttributeDto {
  id: number;
  name: string;
  entries: CatalogFacetEntryDto[];
}

export interface CatalogFacetsDto {
  categories: CatalogFacetCountDto[];
  brands: CatalogFacetCountDto[];
  attributes: CatalogFacetAttributeDto[];
  price: { min: number; max: number } | null;
}
