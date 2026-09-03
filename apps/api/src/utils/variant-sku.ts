import { Prisma } from '@prisma/client';

function slugify(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** One `{ attributeid, attributeValueId }` pair as it is filed on a variant. */
type VariantAttributePair = { attributeid?: number | null; attributeValueId?: number | null };

const isPairList = (attributes: unknown): attributes is VariantAttributePair[] =>
  Array.isArray(attributes) && attributes.every((row) => !!row && typeof row === 'object' && !Array.isArray(row));

/**
 * The SKU-worthy pieces of an attributes JSON, in the order they were filed.
 *
 * The current shape is a list of master-data id pairs, so the readable half of the SKU has to
 * be looked up: `attributeValueId` 12 becomes the entry's value, "L". Rows written before that
 * migration hold the old `{ size: 'L' }` record, whose values are already the text wanted.
 */
async function attributeSkuParts(tx: Prisma.TransactionClient, storeCode: string, attributes: unknown): Promise<string[]> {
  if (!attributes || typeof attributes !== 'object') return [];

  if (isPairList(attributes)) {
    const valueIds = attributes.map((row) => Number(row.attributeValueId)).filter((id) => Number.isInteger(id) && id > 0);
    if (valueIds.length === 0) return [];

    const entries = await tx.masterEntry.findMany({ where: { id: { in: valueIds }, storeCode }, select: { id: true, value: true } });
    const valueById = new Map(entries.map((entry) => [entry.id, entry.value]));

    return valueIds.map((id) => valueById.get(id)).filter((value): value is string => !!value);
  }

  return Object.values(attributes as Record<string, unknown>)
    .filter((value) => value !== null && value !== undefined)
    .map(String);
}

/** `TSHIRT` + ["L", "Red"] -> `TSHIRT-L-RED`. Parts are already resolved to text. */
export function buildVariantSku(base: string, attributeParts: string[] = []): string {
  const parts = [slugify(base), ...attributeParts.map(slugify)].filter((part) => !!part);

  return parts.join('-') || 'VARIANT';
}

export async function resolveVariantSku(
  tx: Prisma.TransactionClient,
  input: { storeCode: string; productId: number; sku?: string | null | undefined; attributes?: unknown }
): Promise<string> {
  if (input.sku) return input.sku;

  const product = await tx.product.findUnique({ where: { id: input.productId }, select: { slug: true, name: true } });
  const attributeParts = await attributeSkuParts(tx, input.storeCode, input.attributes);
  const base = buildVariantSku(product?.slug || product?.name || `P${input.productId}`, attributeParts);

  let candidate = base;
  let n = 1;
  while (await tx.productVariant.findFirst({ where: { storeCode: input.storeCode, sku: candidate }, select: { id: true } })) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}

export async function resolveVariantSlug(
  tx: Prisma.TransactionClient,
  input: { storeCode: string; name: string; slug?: string | null | undefined }
): Promise<string> {
  const base = (input.slug || slugify(input.name) || 'variant').toLowerCase();

  let candidate = base;
  let n = 1;
  while (await tx.productVariant.findFirst({ where: { storeCode: input.storeCode, slug: candidate }, select: { id: true } })) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}
