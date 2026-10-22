import { UserDto } from './user.dto';

export interface LoginResponseDto {
  /** Short-lived access token; also mirrored on `user.token` for the web client. */
  token: string;
  refreshToken: string;
  user: UserDto;
}

export interface refreshTokenResponseDto {
  newToken: string;
  refreshToken: string;
}

export interface TokenDto {
  status: string;
  statusCode: string;
  message: string;
  token: string;
  errors: unknown;
}

export interface OtpDto {
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
}

export interface UpdateOtpDto {
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
}

/** What the web client gets back from `/auth/login` once the response envelope is unwrapped. */
export interface LoginDto {
  token: string | null;
  user: UserDto;
}
