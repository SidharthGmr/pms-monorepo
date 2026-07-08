'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

// This allows to add custom title as well
const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Dashboard', link: '/dashboard' }],
  '/dashboard/add-new-job': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Add New Job', link: '/dashboard/add-new-job' },
  ],
  '/dashboard/add-new-course': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Add New Course', link: '/dashboard/add-new-course' },
  ],
  '/dashboard/lessons': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Lessons', link: '/dashboard/lessons' },
  ],
  '/admin/master-entries': [
    { title: 'Admin', link: '/admin' },
    { title: 'Master Entries', link: '/admin/master-entries' },
  ],
  // Add more custom mappings as needed
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    // Check if we have a custom mapping for this exact path
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    // If no exact match, fall back to generating breadcrumbs from the path
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        title: segment.charAt(0).toUpperCase() + segment.slice(1),
        link: path,
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
