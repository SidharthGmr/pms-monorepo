import { Status } from "../enum/status.enum";

/**
 * `storeCode` is deliberately absent: it is marked `false` in `brandNameSelect`
 * (`brand-name.repository.ts`), so it never leaves the database.
 *
 * `createdAt`/`updatedAt` are `Date | string` because the API returns Date objects and
 * the browser receives them as ISO strings after JSON transport - one type serves both.
 */
export interface BrandNameDto {
  id: number;
  name: string;
  /** Optional logo. Same array shape as `product.images`. */
  images?: string[];
  status: Status;
  displayOrder?: number | null;
  createdAt: Date | string;
  updatedAt: Date | string | null;
}
