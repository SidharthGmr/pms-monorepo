'use client';


import { useRouter } from 'next/navigation';
import { Roles } from '@pms/types';

/** Where a signed-in user belongs. Exported so links can point at it without a redirect. */
export function dashboardPathFor(roles: string[]): string {
  if (roles.includes(Roles.USER) || roles.includes(Roles.STAFF)) return '/dashboard';
  if (roles.includes(Roles.ADMIN)) return '/admin';
  if (roles.includes(Roles.SUPER_ADMIN)) return '/superadmin';
  return '/access-denied';
}

export function useRoleRedirect() {
  const router = useRouter();

  function redirectToRoleBasedDashboard(roles: string[]) {
    router.replace(dashboardPathFor(roles));
  }

  return { redirectToRoleBasedDashboard };
}
