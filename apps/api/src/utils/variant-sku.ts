/**
 * `ProductVariant.sku` is `@unique` and NOT NULL, but most variants in this app are
 * created as a side effect of a price change (a purchase, or a manual price record) -
 * nobody types a SKU at that point. This builds a deterministic, collision-free one.
 *
 * Pass `discriminator` whenever the caller has a stable reference (e.g. a purchase id):
 * it keeps the SKU reproducible and unique inside a batched `createMany`, where every
 * row would otherwise share the same millisecond.
 */
export function buildVariantSku(storeCode: string, productId: number, discriminator?: string): string {
    const suffix = discriminator ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    return `${storeCode}-P${productId}-${suffix}`.toUpperCase();
}
