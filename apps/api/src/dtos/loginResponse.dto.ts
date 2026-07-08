import { UserDto } from "./user.dto";

export interface LoginResponseDto {
  token: string;
  user: UserDto;
}


export interface refreshTokenResponseDto {
  newToken: string;
  refreshToken: string;
}
