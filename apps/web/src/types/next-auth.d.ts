import { UserDto } from '@/dtos/UserDto';
// import { DefaultSession } from 'next-auth';
// declare module 'next-auth' {
//   interface Session {
//     user: UserBasicDto;
//   }
// }


declare module 'next-auth' {
  interface User {
    user: UserDto;
  }
  interface Session {
    user: UserDto;
  }
}

declare module 'next-auth/jwt' {
  interface jwt {
    user: UserDto;
  };
}

