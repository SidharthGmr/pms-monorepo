import { Roles } from '@/enums/roles.enum';
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(function middleware(req) {
  const pageUrl = req.nextUrl.pathname.toLowerCase();

  if (pageUrl === '/access-denied' || pageUrl === '/access-denied/') {
    const referer = req.headers.get('referer');
    const isFromMiddleware = req.nextUrl.searchParams.get('fromMiddleware');
    if (!referer || !isFromMiddleware) {
      return NextResponse.redirect(new URL('/page-not-found', req.url));
    }
  }

  const rolesObject = (req.nextauth.token?.role || '') as string;
  const roles = rolesObject;

  // Role-based page restrictions
  const accessControlMap: Record<string, Roles[]> = {
    '/admin/': [Roles.ADMIN],
    '/dashboard/': [Roles.USER, Roles.STAFF],
  };

  for (const [prefix, requiredRoles] of Object.entries(accessControlMap)) {
    if (pageUrl.startsWith(prefix) && !requiredRoles.some(role => roles.includes(role))) {
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
    '/student/:path*',
    '/access-denied',
    '/access-denied/',
    '/reset-password/'
  ],
};
