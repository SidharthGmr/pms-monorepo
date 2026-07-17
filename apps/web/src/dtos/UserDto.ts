// Re-export the shared user DTOs so `@/dtos/UserDto` resolves to the
// single source of truth in the shared types package.
export type { UserDto, UserBasicDto, UserStatusDto } from '@pms/types';
