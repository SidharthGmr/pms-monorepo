import { CustomResponse } from '@pms/types';
import PlainDto from '../dtos/plain.dto';

/**
 * Shared bodies for the two guards every store-scoped controller repeats. `storeCode` and
 * `userId` both come off the JWT, so a request missing either is rejected before the service
 * layer ever runs. Keeping one copy is what stops the wording drifting per route - the web
 * client matches on these messages.
 */
export const MISSING_STORE_CODE: CustomResponse<PlainDto> = {
  success: false,
  message: 'Store code not found. User must be associated with a store.',
};

/**
 * `createdById` / `updatedById` / `deletedById` are required FKs, so a token carrying no
 * userId cannot write. That is a malformed token rather than a bad request, hence 401.
 */
export const MISSING_USER_ID: CustomResponse<PlainDto> = {
  success: false,
  message: 'User not identified on the request token.',
};
