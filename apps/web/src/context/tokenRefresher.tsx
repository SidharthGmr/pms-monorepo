'use client';

import { scheduleAccessTokenRefresh } from '@/utils/auth';
import { useEffect } from 'react';
import useLogout from '@/hooks/use-logout';

export default function TokenRefresher() {
  const logout = useLogout();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('at');
    if (token) {
      scheduleAccessTokenRefresh(token, logout);
    }
  }, [logout]);

  return null;
}
