import { PartyType as PrismaPartyType, PaymentDirection as PrismaPaymentDirection, PaymentMethod as PrismaPaymentMethod, PaymentStatus as PrismaPaymentStatus, Prisma } from "@prisma/client";
import prisma from "../config/prisma";

import { IPaymentRepository } from "./interfaces/ipayment.repository";
import {
  CreatePaymentDto,
  ListResponseDto,
  OutstandingSummaryDto,
  PaymentDto,
  PaymentFilterParams,
  PaymentVoucherDto,
  UpdatePaymentDto,
} from '@pms/types';
import { outstandingByParty, paymentVoucherSelect, toPaymentVoucherDtos } from './payment-voucher.mapper';

const VOUCHER_SORTABLE_COLUMNS = new Set(['paymentDate', 'amount', 'method', 'status', 'direction', 'voucherNumber', 'createdAt', 'id']);

export class PaymentRepository implements IPaymentRepository {
  async findByOrderId(orderId: number): Promise<PaymentDto[]> {
    return prisma.payment.findMany({ where: { orderId } });
  }

  async findById(id: number): Promise<PaymentDto | null> {
    return prisma.payment.findUnique({ where: { id } });
  }

  async findByTransactionId(transactionId: string): Promise<PaymentDto | null> {
    return prisma.payment.findUnique({ where: { transactionId } });
  }

  async create(data: CreatePaymentDto, tx: Prisma.TransactionClient = prisma): Promise<PaymentDto> {
    return tx.payment.create({ data });
  }

  async update(id: number, data: UpdatePaymentDto, tx: Prisma.TransactionClient = prisma): Promise<PaymentDto> {
    return tx.payment.update({ where: { id }, data });
  }

  async delete(id: number): Promise<PaymentDto> {
    return prisma.payment.delete({ where: { id } });
  }

  async findAllVouchers(filters?: PaymentFilterParams): Promise<ListResponseDto<PaymentVoucherDto>> {
    const column = VOUCHER_SORTABLE_COLUMNS.has(filters?.sortBy ?? '') ? filters!.sortBy! : 'paymentDate';
    const direction: Prisma.SortOrder = filters?.sortDirection?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    const where: Prisma.paymentWhereInput = {};

    if (filters) {
      if (filters.storeCode !== undefined) where.storeCode = filters.storeCode;
      if (filters.direction) where.direction = filters.direction as PrismaPaymentDirection;
      if (filters.method) where.method = filters.method as PrismaPaymentMethod;
      if (filters.paymentStatus) where.status = filters.paymentStatus as PrismaPaymentStatus;
      if (filters.partyType) where.partyType = filters.partyType as PrismaPartyType;
      if (filters.partyId) where.partyId = filters.partyId;
      if (filters.ledgerAccountId !== undefined) where.ledgerAccountId = filters.ledgerAccountId;
      if (filters.orderId !== undefined) where.orderId = filters.orderId;

      if (filters.search) {
        where.OR = [
          { voucherNumber: { contains: filters.search, mode: 'insensitive' } },
          { remarks: { contains: filters.search, mode: 'insensitive' } },
          { transactionId: { contains: filters.search, mode: 'insensitive' } },
          { order: { is: { orderNumber: { contains: filters.search, mode: 'insensitive' } } } },
        ];
      }

      if (filters.startDate || filters.endDate) {
        where.paymentDate = {
          ...(filters.startDate && { gte: new Date(filters.startDate as string) }),
          ...(filters.endDate && { lte: new Date(filters.endDate as string) }),
        };
      }
    }

    const page = filters?.page ?? 1;
    const limit = filters?.recordPerPage ?? 10;
    const showAll = filters?.showAllRecords === true;

    const [rows, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: [{ [column]: direction }, { id: 'desc' }],
        ...(showAll ? {} : { skip: (page - 1) * limit, take: limit }),
        select: paymentVoucherSelect,
      }),
      prisma.payment.count({ where }),
    ]);

    return { totalRecord: total, data: await toPaymentVoucherDtos(rows) };
  }

  async findVoucherById(id: number, storeCode: string): Promise<PaymentVoucherDto | null> {
    const row = await prisma.payment.findFirst({ where: { id, storeCode }, select: paymentVoucherSelect });
    if (!row) return null;
    const [dto] = await toPaymentVoucherDtos([row]);
    return dto ?? null;
  }

  async outstanding(storeCode: string): Promise<OutstandingSummaryDto> {
    return outstandingByParty(storeCode);
  }
}
