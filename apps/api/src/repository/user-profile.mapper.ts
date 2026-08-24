import { Prisma } from '@prisma/client';
import { UserDto } from '../dtos/user.dto';

/**
 * Profile columns (userName, address, bio, ...) live in `UserProfile`, not `users`.
 * Every read that produces a `UserDto` has to pull the relation back in.
 */
export const userProfileInclude = { UserProfile: true } satisfies Prisma.usersInclude;

export type UserWithProfile = Prisma.usersGetPayload<{ include: typeof userProfileInclude }>;

/** Profile fields that `UpdateUserDto` can carry but that no longer live on `users`. */
export const profileFieldNames = [
  'userName',
  'profileImageUrl',
  'dateOfBirth',
  'address',
  'city',
  'state',
  'country',
  'pincode',
  'bio',
] as const;

/**
 * Lean author/owner select for rows that carry a user (reviews, replies, wishlists).
 * `profileImageUrl` lives on `UserProfile`, so it must be selected through the relation -
 * selecting it straight off `users` is a runtime Prisma validation error that TypeScript
 * cannot catch when the select is built as a standalone object.
 */
export const userSummarySelect = {
  userId: true,
  name: true,
  email: true,
  UserProfile: { select: { profileImageUrl: true } },
} satisfies Prisma.usersSelect;

export type UserSummaryRow = Prisma.usersGetPayload<{ select: typeof userSummarySelect }>;

/** Flattens the summary row back to the `{ userId, name, email, profileImageUrl }` DTO shape. */
export function toUserSummary(user: UserSummaryRow): { userId: string; name: string; email: string; profileImageUrl: string | null } {
  const { UserProfile: profile, ...rest } = user;
  return { ...rest, profileImageUrl: profile?.profileImageUrl ?? null };
}

/**
 * Flattens `UserProfile` back onto the user so the API response shape — and therefore
 * the web client — stays exactly as it was before the users/UserProfile split.
 */
export function toUserDto(user: UserWithProfile): UserDto {
  const { UserProfile: profile, ...rest } = user;
  return {
    ...rest,
    // The web client reads `usersId` (see @pms/types UserDto); expose it alongside `userId`.
    usersId: user.userId,
    userName: profile?.userName ?? '',
    profileImageUrl: profile?.profileImageUrl ?? null,
    dateOfBirth: profile?.dateOfBirth ?? null,
    address: profile?.address ?? null,
    city: profile?.city ?? null,
    state: profile?.state ?? null,
    country: profile?.country ?? null,
    pincode: profile?.pincode ?? null,
    bio: profile?.bio ?? null,
  };
}
