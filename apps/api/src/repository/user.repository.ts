import { Status, Role } from "@prisma/client";
import prisma from "../config/prisma";
import { UpdateUserDto, UserDto } from "../dtos/user.dto";
import { IUserRepository } from "./interfaces/iuser.repository";
import { UserFilterParams } from "../params/user.params";

export class UserRepository implements IUserRepository {
  async findAll(filters: UserFilterParams): Promise<UserDto[]> {
    const where: any = { NOT: { status: Status.Trash } };
    if (filters.storeCode) {
      where.storeCode = filters.storeCode;
    }

    if (filters.role) {
      where.role = filters.role;
    }

    return prisma.users.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(userId: string): Promise<UserDto | null> {
    return prisma.users.findUnique({
      where: { userId, status: Status.Published },
    });
  }

  async findByPhone(phone: string): Promise<UserDto | null> {
    return prisma.users.findFirst({
      where: { phone, status: Status.Published },
    });
  }

  async findByEmail(email: string): Promise<UserDto | null> {
    return prisma.users.findUnique({
      where: {
        email: email,
        status: Status.Published,
      },
    });
  }

  async update(userId: string, data: UpdateUserDto): Promise<UserDto> {
    return prisma.users.update({
      where: { userId },
      data,
    });
  }

  async updateStatus(
    userId: string,
    updatedData: UpdateUserDto
  ): Promise<UserDto> {
    return prisma.users.update({
      where: { userId },
      data: { status: Status.Trash },
    });
  }

  async updateActiveStatus(userId: string, isActive: boolean): Promise<UserDto> {
    return prisma.users.update({
      where: { userId },
      data: { isActive },
    });
  }

  async delete(userId: string): Promise<UserDto> {
    return prisma.users.update({
      where: { userId },
      data: { status: Status.Trash },
    });
  }

  async updateRole(userId: string, role: Role): Promise<UserDto> {
    return prisma.users.update({
      where: { userId },
      data: { role },
    });
  }

  async getBystoreId(storeId: string): Promise<UserDto | null> {
    return prisma.users.findFirst({
      where: { storeCode: storeId, status: Status.Published },
    });
  }

}
