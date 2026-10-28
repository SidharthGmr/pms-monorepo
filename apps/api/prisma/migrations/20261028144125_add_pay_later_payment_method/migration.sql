-- AlterEnum
-- PAY_LATER (udhari) was added to schema.prisma without a migration, so the database
-- enum lacked it and checkout.service.ts threw when filing a pay-later payment.
ALTER TYPE "PaymentMethod" ADD VALUE 'PAY_LATER';
