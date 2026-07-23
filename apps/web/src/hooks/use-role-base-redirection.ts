'use client';

import { Roles } from '@/enums/roles.enum';
import { useRouter } from 'next/navigation';

export function useRoleRedirect() {
  const router = useRouter();

  function redirectToRoleBasedDashboard(roles: string[]) {
    if (roles.includes(Roles.USER) || roles.includes(Roles.STAFF)) {
      router.replace('/dashboard');
    } else if (roles.includes(Roles.ADMIN)) {
      router.replace('/admin');
    } else if (roles.includes(Roles.SUPER_ADMIN)) {
      router.replace('/super-admin');
    }
    else {
      router.replace('/access-denied');
    }
  }

  return { redirectToRoleBasedDashboard };
}
