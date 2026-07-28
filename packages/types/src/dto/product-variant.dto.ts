/**
 * This package intentionally has no @prisma/client dependency, so it declares its own
 * JSON value type. It is structurally compatible with Prisma's `JsonValue`, which is
 * what the API assigns to it. (The global `JSON` is the parse/stringify object, not a
 * value type, so it can never describe a Json column.)
 */
export type JsonObject = { [key: string]: JsonValue | undefined };
export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];

export interface ProductVariantResponseDto {
  id: number;
  productId: number;
  storeCode: string;
  sku: string;
  attributes: JsonValue;
  sellingPrice: number;
  costPrice: number | null;
  effectiveFrom: Date;
  isActive: boolean;
  reason: string | null;
  createdById: string;
  createdAt: Date;
}
