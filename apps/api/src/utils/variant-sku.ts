/**
 * `ProductVariant.sku` is `@unique` (per store) and NOT NULL, but a SKU is rarely typed -
 * variants are often created as a side effect of a price change. This builds a readable,
 * deterministic SKU from the product and the variant's attribute values, e.g.
 *   product "iphone-15" + { storage: "64Gb", ram: "4GB" }  ->  "IPHONE-15-64GB-4GB"
 *
 * The result is a *base*; the repository appends a numeric suffix when it would collide
 * (e.g. two attribute-less rows on the same product), so callers get a unique value.
 */

/** Upper-case, keep only A-Z0-9, collapse everything else to single hyphens. */
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

  // A product with no slug and no attributes still needs something non-empty.
  return parts.join('-') || 'VARIANT';
}
