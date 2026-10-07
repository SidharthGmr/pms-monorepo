import { Status, Role, Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { UpdateUserDto, UserDto } from "../dtos/user.dto";
import { ListResponseDto } from "../dtos/list-response.dto";
import { IUserRepository } from "./interfaces/iuser.repository";
import { UserFilterParams } from "../params/user.params";
import { toUserDto, userProfileInclude } from "./user-profile.mapper";

const SORTABLE_COLUMNS = new Set(['name', 'email', 'role', 'status', 'isActive', 'lastLoginAt', 'createdAt', 'updatedAt']);

export class UserRepository implements IUserRepository {
  async findAll(filters: UserFilterParams): Promise<ListResponseDto<UserDto>> {
    const where: Prisma.usersWhereInput = {};

    // Trashed accounts stay hidden unless they are what was asked for.
    if (filters.status !== undefined) {
      where.status = filters.status;
    } else {
      where.NOT = { status: Status.Trash };
    }

    if (filters.storeCode) {
      where.storeCode = filters.storeCode;
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.email) {
      where.email = filters.email;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.phone) {
      where.phone = filters.phone;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { UserProfile: { userName: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    if (filters.startDate != null || filters.endDate != null) {
      where.createdAt = {
        ...(filters.startDate != null && { gte: new Date(filters.startDate) }),
        ...(filters.endDate != null && { lte: new Date(filters.endDate) }),
      };
    }

    const sortBy = filters.sortBy && SORTABLE_COLUMNS.has(filters.sortBy) ? filters.sortBy : 'createdAt';
    const sortOrder: Prisma.SortOrder = String(filters.sortDirection).toUpperCase() === 'ASC' ? 'asc' : 'desc';

    const page = filters.page ?? 1;
    const limit = filters.recordPerPage ?? 10;
    const showAll = filters.showAllRecords === true;

    const [records, totalRecord] = await Promise.all([
      prisma.users.findMany({
        where,
        include: userProfileInclude,
        orderBy: { [sortBy]: sortOrder },
        ...(showAll ? {} : { skip: (page - 1) * limit, take: limit }),
      }),
      prisma.users.count({ where }),
    ]);

    return { totalRecord, data: records.map(toUserDto) };
  }

  async findById(userId: string): Promise<UserDto | null> {
    const user = await prisma.users.findUnique({
      where: { userId, status: Status.Published },
      include: userProfileInclude,
    });
    return user ? toUserDto(user) : null;
  }

  async findByPhone(phone: string): Promise<UserDto | null> {
    const user = await prisma.users.findFirst({
      where: { phone, status: Status.Published },
      include: userProfileInclude,
    });
    return user ? toUserDto(user) : null;
  }

  async findByEmail(email: string): Promise<UserDto | null> {
    const user = await prisma.users.findUnique({
      where: {
        email: email,
        status: Status.Published,
      },
      include: userProfileInclude,
    });
    return user ? toUserDto(user) : null;
  }

  async update(userId: string, data: UpdateUserDto): Promise<UserDto> {
    // Profile fields have to be routed to the related `UserProfile` row.
    const { userName, profileImageUrl, dateOfBirth, address, city, state, country, pincode, bio, storeId, ...userFields } = data;
    const profileFields = { userName, profileImageUrl, dateOfBirth, address, city, state, country, pincode, bio };
    const hasProfileUpdate = Object.values(profileFields).some((value) => value !== undefined);

    let profileWrite: { upsert: { create: any; update: any } } | undefined;

    if (hasProfileUpdate) {
      // `UserProfile.name`/`userName` are required, so the create branch needs
      // fallbacks for users whose profile row does not exist yet.
      const existing = await prisma.users.findUnique({
        where: { userId },
        include: userProfileInclude,
      });

      profileWrite = {
        upsert: {
          create: {
            ...profileFields,
            name: userFields.name ?? existing?.UserProfile?.name ?? existing?.name ?? '',
            userName: userName ?? existing?.UserProfile?.userName ?? userId,
          },
          update: profileFields,
        },
      };
    }

    const user = await prisma.users.update({
      where: { userId },
      data: {
        ...userFields,
        ...(profileWrite && { UserProfile: profileWrite }),
      },
      include: userProfileInclude,
    });
    return toUserDto(user);
  }

  async updateStatus(
    userId: string,
    updatedData: UpdateUserDto
  ): Promise<UserDto> {
    const user = await prisma.users.update({
      where: { userId },
      data: { status: Status.Trash },
      include: userProfileInclude,
    });
    return toUserDto(user);
  }

  async updateActiveStatus(userId: string, isActive: boolean): Promise<UserDto> {
    const user = await prisma.users.update({
      where: { userId },
      data: { isActive },
      include: userProfileInclude,
    });
    return toUserDto(user);
  }

  async delete(userId: string): Promise<UserDto> {
    const user = await prisma.users.update({
      where: { userId },
      data: { status: Status.Trash },
      include: userProfileInclude,
    });
    return toUserDto(user);
  }

  async updateRole(userId: string, role: Role): Promise<UserDto> {
    const user = await prisma.users.update({
      where: { userId },
      data: { role },
      include: userProfileInclude,
    });
    return toUserDto(user);
  }

  async getBystoreId(storeId: string): Promise<UserDto | null> {
    const user = await prisma.users.findFirst({
      where: { storeCode: storeId, status: Status.Published },
      include: userProfileInclude,
    });
    return user ? toUserDto(user) : null;
  }

}
