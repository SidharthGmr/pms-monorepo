import { OutstandingPartyDto, OutstandingSummaryDto, PaymentVoucherDto } from '@pms/types';
import { AccountSubType, Prisma } from '@prisma/client';
import prisma from '../config/prisma';

/**
 * The read side of payment vouchers, kept beside the repository because the shape is shared by
 * the list and the single read. `journalEntryId` is resolved from the journal rather than
 * stored on the payment, so a voucher always points at the entry that actually exists.
 */
export const paymentVoucherSelect = {
  id: true,
  voucherNumber: true,
  direction: true,
  amount: true,
  method: true,
  status: true,
  paymentDate: true,
  remarks: true,
  transactionId: true,
  orderId: true,
  partyType: true,
  partyId: true,
  ledgerAccountId: true,
  createdAt: true,
  updatedAt: true,
  storeCode: false,
  order: { select: { orderNumber: true } },
  ledgerAccount: { select: { name: true } },
  allocations: { select: { id: true, targetType: true, targetId: true, amount: true } },
} satisfies Prisma.paymentSelect;

export type PaymentVoucherRow = Prisma.paymentGetPayload<{ select: typeof paymentVoucherSelect }>;

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Turns rows into DTOs, resolving the party names, the journal entries and the labels for
 * whatever each allocation points at - all in a fixed number of queries however many rows
 * there are, because the remote database makes per-row lookups expensive.
 */
export async function toPaymentVoucherDtos(rows: PaymentVoucherRow[]): Promise<PaymentVoucherDto[]> {
  if (rows.length === 0) return [];

  const customerIds = [...new Set(rows.filter((row) => row.partyType === 'CUSTOMER').map((row) => row.partyId).filter((id): id is string => !!id))];
  const supplierIds = [
    ...new Set(
      rows
        .filter((row) => row.partyType === 'SUPPLIER')
        .map((row) => Number(row.partyId))
        .filter((id) => Number.isFinite(id))
    ),
  ];
  const orderTargets = [...new Set(rows.flatMap((row) => row.allocations.filter((a) => a.targetType === 'ORDER').map((a) => a.targetId)))];
  const purchaseTargets = [...new Set(rows.flatMap((row) => row.allocations.filter((a) => a.targetType === 'PURCHASE').map((a) => a.targetId)))];

  const [customers, suppliers, orders, purchases, entries] = await Promise.all([
    customerIds.length ? prisma.users.findMany({ where: { userId: { in: customerIds } }, select: { userId: true, name: true } }) : [],
    supplierIds.length ? prisma.supplier.findMany({ where: { id: { in: supplierIds } }, select: { id: true, name: true } }) : [],
    orderTargets.length ? prisma.order.findMany({ where: { id: { in: orderTargets } }, select: { id: true, orderNumber: true } }) : [],
    purchaseTargets.length ? prisma.purchase.findMany({ where: { id: { in: purchaseTargets } }, select: { id: true, invoiceNumber: true } }) : [],
    prisma.journalEntry.findMany({
      where: { sourceType: 'payment', sourceId: { in: rows.map((row) => row.id) } },
      select: { id: true, sourceId: true, voucherNumber: true },
    }),
  ]);

  const customerName = new Map(customers.map((row) => [row.userId, row.name] as const));
  const supplierName = new Map(suppliers.map((row) => [String(row.id), row.name] as const));
  const orderNumber = new Map(orders.map((row) => [row.id, row.orderNumber] as const));
  const purchaseNumber = new Map(purchases.map((row) => [row.id, row.invoiceNumber] as const));
  const entryBySource = new Map(entries.map((row) => [row.sourceId!, row] as const));

  return rows.map((row) => {
    const allocations = row.allocations.map((allocation) => ({
      id: allocation.id,
      targetType: allocation.targetType,
      targetId: allocation.targetId,
      targetLabel:
        allocation.targetType === 'ORDER'
          ? (orderNumber.get(allocation.targetId) ?? null)
          : allocation.targetType === 'PURCHASE'
            ? (purchaseNumber.get(allocation.targetId) ?? null)
            : null,
      amount: allocation.amount.toNumber(),
    }));

    const allocated = round2(allocations.reduce((sum, allocation) => sum + allocation.amount, 0));
    const entry = entryBySource.get(row.id);

    return {
      id: row.id,
      voucherNumber: row.voucherNumber,
      direction: row.direction,
      amount: row.amount,
      method: row.method,
      status: row.status,
      paymentDate: row.paymentDate,
      remarks: row.remarks,
      transactionId: row.transactionId,
      orderId: row.orderId,
      orderNumber: row.order?.orderNumber ?? null,
      partyType: row.partyType,
      partyId: row.partyId,
      partyName:
        row.partyType === 'CUSTOMER'
          ? (customerName.get(row.partyId ?? '') ?? null)
          : row.partyType === 'SUPPLIER'
            ? (supplierName.get(row.partyId ?? '') ?? null)
            : null,
      ledgerAccountId: row.ledgerAccountId,
      ledgerAccountName: row.ledgerAccount?.name ?? null,
      journalEntryId: entry?.id ?? null,
      journalVoucherNumber: entry?.voucherNumber ?? null,
      allocations,
      unallocatedAmount: round2(row.amount - allocated),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  });
}

/**
 * What each party still owes or is owed, taken from the receivable and payable control
 * accounts' own journal lines. Nothing is stored: a balance here is always the journal's
 * answer, which is why a payment can never leave it stale.
 */
export async function outstandingByParty(storeCode: string): Promise<OutstandingSummaryDto> {
  const controls = await prisma.ledgerAccount.findMany({
    where: { storeCode, subType: { in: [AccountSubType.RECEIVABLE, AccountSubType.PAYABLE] } },
    select: { id: true, subType: true },
  });
  const receivableIds = controls.filter((row) => row.subType === AccountSubType.RECEIVABLE).map((row) => row.id);
  const payableIds = controls.filter((row) => row.subType === AccountSubType.PAYABLE).map((row) => row.id);

  const grouped = await prisma.journalLine.groupBy({
    by: ['partyType', 'partyId', 'ledgerAccountId'],
    where: {
      storeCode,
      partyId: { not: null },
      ledgerAccountId: { in: [...receivableIds, ...payableIds] },
      entry: { status: 'POSTED' },
    },
    _sum: { debit: true, credit: true },
  });

  const customerBalances = new Map<string, number>();
  const supplierBalances = new Map<string, number>();

  for (const row of grouped) {
    if (!row.partyId) continue;
    const debit = row._sum.debit?.toNumber() ?? 0;
    const credit = row._sum.credit?.toNumber() ?? 0;

    if (receivableIds.includes(row.ledgerAccountId)) {
      customerBalances.set(row.partyId, round2((customerBalances.get(row.partyId) ?? 0) + debit - credit));
    } else {
      supplierBalances.set(row.partyId, round2((supplierBalances.get(row.partyId) ?? 0) + credit - debit));
    }
  }

  const customerIds = [...customerBalances.keys()];
  const supplierIds = [...supplierBalances.keys()].map((id) => Number(id)).filter((id) => Number.isFinite(id));

  const [customers, suppliers] = await Promise.all([
    customerIds.length ? prisma.users.findMany({ where: { userId: { in: customerIds } }, select: { userId: true, name: true } }) : [],
    supplierIds.length ? prisma.supplier.findMany({ where: { id: { in: supplierIds } }, select: { id: true, name: true } }) : [],
  ]);
  const customerName = new Map(customers.map((row) => [row.userId, row.name] as const));
  const supplierName = new Map(suppliers.map((row) => [String(row.id), row.name] as const));

  // A settled party nets to zero, which is not an outstanding balance worth listing.
  const toRows = (balances: Map<string, number>, partyType: 'CUSTOMER' | 'SUPPLIER', names: Map<string, string>): OutstandingPartyDto[] =>
    [...balances.entries()]
      .filter(([, balance]) => Math.abs(balance) >= 0.01)
      .map(([partyId, balance]) => ({ partyType, partyId, partyName: names.get(partyId) ?? null, balance }))
      .sort((a, b) => b.balance - a.balance);

  const customerRows = toRows(customerBalances, 'CUSTOMER', customerName);
  const supplierRows = toRows(supplierBalances, 'SUPPLIER', supplierName);

  return {
    receivableTotal: round2(customerRows.reduce((sum, row) => sum + row.balance, 0)),
    payableTotal: round2(supplierRows.reduce((sum, row) => sum + row.balance, 0)),
    customers: customerRows,
    suppliers: supplierRows,
  };
}
