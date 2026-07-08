'use client';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { UserDto } from '@/dtos/UserDto';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';

export default function useLogout() {
  const { data: session, status } = useSession();
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const [currentUser, setCurrentUser] = useState<UserDto>();

  useEffect(() => {
    if (status && status === 'authenticated' && session && session.user) {
      setCurrentUser(session.user);
    }
  }, [status, session]);

  const logout = useCallback(async () => {
    await unitOfService.AccountService.logout(currentUser?.token || '');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('at');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('email');
      localStorage.removeItem('fullName');
      localStorage.removeItem('profilePicture');
      localStorage.removeItem('utz');
      localStorage.removeItem('locales');
    }
    await signOut({ callbackUrl: '/login' });
  }, [currentUser?.token, unitOfService.AccountService]);

  return logout;
}
