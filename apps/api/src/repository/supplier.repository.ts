import { Prisma, Status } from "@prisma/client";
import prisma from "../config/prisma";
import { SupplierDto } from "../dtos/supplier.dto";
import { ListResponseDto } from "../dtos/list-response.dto";
import { SupplierFilterParams } from "../params/supplier.params";
import { ISupplierRepository } from "./interfaces/isupplier.repository";

export class SupplierRepository implements ISupplierRepository {
    async findAll(
        filters?: SupplierFilterParams,
        page = 1,
        limit = 10,
        sortBy = 'displayOrder',
        sortOrder: 'asc' | 'desc' = 'asc'
    ): Promise<ListResponseDto<SupplierDto>> {
        const where: Prisma.supplierWhereInput = { NOT: { status: Status.Trash } };

        if (filters) {
            page = filters.page ?? page;
            limit = filters.recordPerPage ?? limit;

            if (filters.search) {
                where.OR = [
                    { name: { contains: filters.search, mode: 'insensitive' } },
                    { contactPerson: { contains: filters.search, mode: 'insensitive' } },
                    { email: { contains: filters.search, mode: 'insensitive' } },
                    { phone: { contains: filters.search, mode: 'insensitive' } },
                ];
            }

            if (filters.status !== undefined) {
                where.status = filters.status;
            } else {
                where.NOT = { status: Status.Trash };
            }

            if (filters.storeCode !== undefined) {
                where.storeCode = filters.storeCode;
            }
        }

        const showAll = filters?.showAllRecords === true;
        const skip = showAll ? undefined : (page - 1) * limit;
        const take = showAll ? undefined : limit;

        const [data, total] = await Promise.all([
            prisma.supplier.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                ...(skip !== undefined && { skip }),
                ...(take !== undefined && { take }),
            }),
            prisma.supplier.count({ where }),
        ]);

        return { totalRecord: total, data };
    }

    async findById(id: number): Promise<SupplierDto | null> {
        return prisma.supplier.findUnique({ where: { id } });
    }

    async delete(id: number): Promise<SupplierDto> {
        return prisma.supplier.update({ where: { id }, data: { status: Status.Trash } });
    }
}
