import { Status, Role } from "@prisma/client";
import prisma from "../config/prisma";
import { UpdateUserDto, UserDto } from "../dtos/user.dto";
import { IUserRepository } from "./interfaces/iuser.repository";
import { UserFilterParams } from "../params/user.params";
import { toUserDto, userProfileInclude } from "./user-profile.mapper";

export class UserRepository implements IUserRepository {
  async findAll(filters: UserFilterParams): Promise<UserDto[]> {
    const where: any = { NOT: { status: Status.Trash } };
    if (filters.storeCode) {
      where.storeCode = filters.storeCode;
    }

    if (filters.role) {
      where.role = filters.role;
    }

    const records = await prisma.users.findMany({
      where,
      include: userProfileInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    return records.map(toUserDto);
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
