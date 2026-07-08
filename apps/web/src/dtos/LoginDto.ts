import {   UserDto } from './UserDto';

export interface LoginDto {
  token: string | null;
  user: UserDto;
}


export interface refreshTokenResponseDto {
  newToken: string;
  refreshToken: string;
}
