import { PrismaClient } from "@prisma/client";
import env, { isProduction } from "./env";
import logger from "../utils/logger";

/**
 * `nodemon` and Next-style hot reloads re-evaluate this module on every change.
 * Without the global cache each reload opens a fresh connection pool until
 * Postgres refuses new clients ("too many connections").
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Queries are only echoed when explicitly asked for - they contain user data
    // and, at production traffic, would dwarf every other log line.
    log: isProduction ? [{ emit: 'event', level: 'warn' }, { emit: 'event', level: 'error' }] : ['warn', 'error'],
  });

if (isProduction) {
  // `as any` because the event names are only present on the typed client when
  // the matching `emit: 'event'` entry is in the constructor's log array.
  (prisma as any).$on('warn', (event: { message: string }) => logger.warn('prisma', { error: event.message }));
  (prisma as any).$on('error', (event: { message: string }) => logger.error('prisma', { error: event.message }));
}

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
