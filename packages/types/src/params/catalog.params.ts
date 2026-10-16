import { PageFilterParams } from "./page.params";

/**
 * Variant-level storefront filters. `entryIds` carries the ticked attribute values
 * (MasterEntry ids) as one flat list; the API groups them by their attribute, ORs the values
 * inside a group and ANDs across groups - tick Black + White + size M and you get
 * (Black OR White) AND M, which is how every e-commerce sidebar behaves.
 */
export interface CatalogFilterParams extends PageFilterParams {
  categoryIds?: number[];
  brandNameIds?: number[];
  entryIds?: number[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  offersOnly?: boolean;
  featuredOnly?: boolean;
  minRating?: number;
  /** price | name | newest | rating; anything else falls back to newest. */
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}
