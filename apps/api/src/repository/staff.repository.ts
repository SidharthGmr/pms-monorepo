import { injectable } from "inversify";
import prisma from "../config/prisma";
import { StaffDto } from "../dtos/staff.dto";
import { IStaffRepository } from "./interfaces/istaff.repository";
import { StaffFilterParams } from "../params/staff.params";

@injectable()
export class StaffRepository implements IStaffRepository {
    async findAll(filters?: StaffFilterParams): Promise<StaffDto[]> {
        const where: any = {};

        if (filters?.storeId) where.store = { id: filters.storeId };
        if (filters?.storeCode) where.storeCode = filters.storeCode;
        if (filters?.isActive !== undefined) where.isActive = filters.isActive;
        if (filters?.department) where.department = filters.department;
        if (filters?.position) where.position = filters.position;

        return prisma.staff.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                    },
                },
                store: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async findById(id: number): Promise<StaffDto | null> {
        return prisma.staff.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                    },
                },
                store: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        });
    }

    async findByUserId(userId: string): Promise<StaffDto | null> {
        return prisma.staff.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                    },
                },
                store: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        });
    }

    async findByStoreCode(storeCode: string): Promise<StaffDto[]> {
        return prisma.staff.findMany({
            where: { storeCode },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                    },
                },
                store: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async create(data: any): Promise<StaffDto> {
        return prisma.staff.create({
            data,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                    },
                },
                store: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        });
    }

    async update(id: number, data: any): Promise<StaffDto> {
        return prisma.staff.update({
            where: { id },
            data,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                    },
                },
                store: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        });
    }

    async delete(id: number): Promise<StaffDto> {
        return prisma.staff.delete({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                    },
                },
                store: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        });
    }

    async count(filters?: StaffFilterParams): Promise<number> {
        const where: any = {};

        if (filters?.storeId) where.store = { id: filters.storeId };
        if (filters?.storeCode) where.storeCode = filters.storeCode;
        if (filters?.isActive !== undefined) where.isActive = filters.isActive;
        if (filters?.department) where.department = filters.department;
        if (filters?.position) where.position = filters.position;

        return prisma.staff.count({ where });
    }
}
