import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { list } from '@vercel/blob';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { Roles } from '@pms/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as any;
    const userId = user.id ?? user.userId;

    // Super admin sees every user's folder; a regular admin only their own - the same
    // namespacing the upload route writes to.
    const isSuperAdmin = user.role === Roles.SUPER_ADMIN;
    const prefix = isSuperAdmin ? 'uploads/' : `uploads/user_${userId}/`;

    const { blobs } = await list({ prefix, limit: 500 });

    return NextResponse.json({
      success: true,
      images: blobs
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        .map((blob) => ({
          // The store is private, so the usable URL is this app's authenticated serving route.
          url: `/api/blob/view/${blob.pathname}`,
          pathname: blob.pathname,
          size: blob.size,
          uploadedAt: blob.uploadedAt,
        })),
      userFolder: prefix,
      isSuperAdmin,
    });
  } catch (error: any) {
    console.error('Blob list error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch files' }, { status: 500 });
  }
}
