import { Prisma } from '@prisma/client';

function slugify(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildVariantSku(base: string, attributes?: Record<string, unknown> | null): string {
  const parts: string[] = [];

  const head = slugify(base);
  if (head) parts.push(head);

  if (attributes && typeof attributes === 'object') {
    for (const value of Object.values(attributes)) {
      if (value === null || value === undefined) continue;
      const piece = slugify(String(value));
      if (piece) parts.push(piece);
    }
  }

  return parts.join('-') || 'VARIANT';
}

export async function resolveVariantSku(
  tx: Prisma.TransactionClient,
  input: { storeCode: string; productId: number; sku?: string | null | undefined; attributes?: unknown }
): Promise<string> {
  if (input.sku) return input.sku;

  const product = await tx.product.findUnique({ where: { id: input.productId }, select: { slug: true, name: true } });
  const base = buildVariantSku(product?.slug || product?.name || `P${input.productId}`, input.attributes as Record<string, unknown> | undefined);

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
