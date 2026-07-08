'use client';

import { scheduleAccessTokenRefresh } from '@/utils/auth';
import { useEffect } from 'react';
import useLogout from '@/hooks/use-logout';
import { toast } from '@/components/ui/use-toast';

export default function TokenRefresher() {
  const logout = useLogout();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('at');
    if (token) {
      scheduleAccessTokenRefresh(token, logout, () => {
        toast({ variant: 'success', title: '🔄 Token refreshed', description: new Date().toLocaleTimeString() });
      });
    }
  }, [logout]);

  return null;
}
