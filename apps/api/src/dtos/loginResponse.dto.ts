import { UserDto } from "./user.dto";

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
