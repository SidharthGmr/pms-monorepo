
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { Roles } from '@pms/types';

export default withAuth(function middleware(req) {
  const pageUrl = req.nextUrl.pathname.toLowerCase();

  if (pageUrl === '/access-denied' || pageUrl === '/access-denied/') {
    const referer = req.headers.get('referer');
    const isFromMiddleware = req.nextUrl.searchParams.get('fromMiddleware');
    if (!referer || !isFromMiddleware) {
      return NextResponse.redirect(new URL('/page-not-found', req.url));
    }
  }

  const role = (req.nextauth.token?.role || '') as string;

  // Role-based page restrictions. Exact matches only - a substring check would let any
  // future role that contains another one (SUPER_ADMIN contains ADMIN) inherit its pages.
  const accessControlMap: Record<string, Roles[]> = {
    '/superadmin/': [Roles.SUPER_ADMIN],
    '/admin/': [Roles.ADMIN, Roles.SUPER_ADMIN],
    '/dashboard/': [Roles.USER, Roles.STAFF],
  };

  for (const [prefix, requiredRoles] of Object.entries(accessControlMap)) {
    if (pageUrl.startsWith(prefix) && !requiredRoles.some((allowed) => allowed === role)) {
      const redirectUrl = new URL('/access-denied', req.url);
      redirectUrl.searchParams.set('fromMiddleware', 'true');
      return NextResponse.redirect(redirectUrl);
    }
  }
},
  {
    callbacks: {
      authorized: ({ token }) => {
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/superadmin/:path*',
    '/dashboard/:path*',
    '/account/myprofile',
    '/access-denied',
    '/access-denied/',
  ],
};
