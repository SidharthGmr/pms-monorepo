/**
 * Quick health/row-count check of the database:
 *
 *   npm run db:check            (from apps/api)
 *
 * Reads DATABASE_URL from .env (the shared production DB, neon-celeste-clock).
 * Read-only - it never writes, so it is always safe to run.
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log('DATABASE_URL is not set');
    process.exitCode = 1;
    return;
  }
  const host = new URL(url).host;
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const [users, stores, products, orders, migrations] = await Promise.all([
      prisma.users.count(),
      prisma.store.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.$queryRawUnsafe('SELECT count(*)::int AS n FROM "_prisma_migrations" WHERE finished_at IS NOT NULL'),
    ]);
    console.log(`DB OK  ${host}`);
    console.log(`       migrations: ${migrations[0].n} | users: ${users} | stores: ${stores} | products: ${products} | orders: ${orders}`);
  } catch (error) {
    console.log(`DB FAILED  ${host}`);
    console.log(`       ${error.message.split('\n').pop()}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
