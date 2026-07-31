/**
 * Exercises the reworked price/stock derivation against a real database, using the same
 * helpers the repositories use. Run with: npx ts-node scripts/smoke-pricing.ts
 */
import prisma from '../src/config/prisma';
import { PriceHistoryRepository } from '../src/repository/price-history.repository';
import { priceForVariant, stockForVariant } from '../src/utils/variant-pricing';

const CODE = 'PSMOKE';
const UID = 'psmoke-user';
const priceRepo = new PriceHistoryRepository();

const day = (offset: number) => new Date(Date.now() + offset * 86_400_000);
let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  got=${JSON.stringify(actual)} want=${JSON.stringify(expected)}`);
}

async function main() {
  await prisma.store.create({ data: { name: 'Pricing Smoke', code: CODE } });
  await prisma.users.create({
    data: { userId: UID, name: 'Smoke', email: 'psmoke@example.com', password: 'x', storeCode: CODE },
  });
  const category = await prisma.category.create({ data: { name: 'Shirts', storeCode: CODE, createdById: UID } });
  const product = await prisma.product.create({
    data: { name: 'Tee', slug: 'tee-psmoke', storeCode: CODE, categoryId: category.id, createdById: UID },
  });
  const variant = await prisma.productVariant.create({
    data: { productId: product.id, storeCode: CODE, sku: 'TEE-RED-L', attributes: { size: 'L' }, isActive: true, createdById: UID },
  });

  console.log('\n-- an unpriced variant has no price, not a price of zero --');
  check('price before any ledger row', await priceForVariant(variant.id), null);

  console.log('\n-- first price --');
  await priceRepo.create({ variantId: variant.id, storeCode: CODE, sellingPrice: 100, costPrice: 60, effectiveFrom: day(-10), createdById: UID });
  check('current sellingPrice', (await priceForVariant(variant.id))?.sellingPrice, 100);

  console.log('\n-- a second price supersedes the first and closes it --');
  await priceRepo.create({ variantId: variant.id, storeCode: CODE, sellingPrice: 120, effectiveFrom: day(-2), createdById: UID });
  check('current sellingPrice', (await priceForVariant(variant.id))?.sellingPrice, 120);
  check('price as at 5 days ago (backdated order)', (await priceForVariant(variant.id, day(-5)))?.sellingPrice, 100);
  const open = await prisma.priceHistory.count({ where: { variantId: variant.id, effectiveTo: null } });
  check('exactly one open row', open, 1);

  console.log('\n-- a future-dated price stages without becoming current --');
  await priceRepo.create({ variantId: variant.id, storeCode: CODE, sellingPrice: 200, effectiveFrom: day(5), createdById: UID });
  check('current sellingPrice still today\'s', (await priceForVariant(variant.id))?.sellingPrice, 120);
  check('price in 6 days', (await priceForVariant(variant.id, day(6)))?.sellingPrice, 200);

  console.log('\n-- stock is the sum of movements --');
  check('stock before any movement', await stockForVariant(variant.id), 0);
  await prisma.stockHistory.createMany({
    data: [
      { productId: product.id, variantId: variant.id, storeCode: CODE, createdById: UID, quantity: 50, reason: 'Opening' },
      { productId: product.id, variantId: variant.id, storeCode: CODE, createdById: UID, quantity: -3, reason: 'Sale' },
    ],
  });
  check('stock after +50 then -3', await stockForVariant(variant.id), 47);

  console.log('\n-- a sibling variant keeps its own stock --');
  const sibling = await prisma.productVariant.create({
    data: { productId: product.id, storeCode: CODE, sku: 'TEE-RED-S', attributes: { size: 'S' }, isActive: true, createdById: UID },
  });
  check('sibling stock is independent', await stockForVariant(sibling.id), 0);
  check('original stock unaffected', await stockForVariant(variant.id), 47);
}

main()
  .catch((error) => { failures++; console.error('THREW:', error); })
  .finally(async () => {
    await prisma.stockHistory.deleteMany({ where: { storeCode: CODE } });
    await prisma.priceHistory.deleteMany({ where: { storeCode: CODE } });
    await prisma.productVariant.deleteMany({ where: { storeCode: CODE } });
    await prisma.product.deleteMany({ where: { storeCode: CODE } });
    await prisma.category.deleteMany({ where: { storeCode: CODE } });
    await prisma.users.deleteMany({ where: { userId: UID } });
    await prisma.store.deleteMany({ where: { code: CODE } });
    await prisma.$disconnect();
    console.log(failures === 0 ? '\nAll checks passed; cleaned up.' : `\n${failures} check(s) FAILED; cleaned up.`);
    process.exitCode = failures === 0 ? 0 : 1;
  });
