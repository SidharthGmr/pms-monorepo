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

    // New uploads land flat under assets/ and are shared between admins; legacy files still
    // sit under uploads/ in per-user folders, which only their owner (or the super admin) sees.
    const isSuperAdmin = user.role === Roles.SUPER_ADMIN;
    const ownLegacyPrefix = `uploads/user_${userId}/`;

    const [assetsResult, legacyResult] = await Promise.all([list({ prefix: 'assets/', limit: 500 }), list({ prefix: 'uploads/', limit: 500 })]);
    const allBlobs = [...assetsResult.blobs, ...legacyResult.blobs];
    const blobs = isSuperAdmin
      ? allBlobs
      : allBlobs.filter((blob) => !blob.pathname.startsWith('uploads/user_') || blob.pathname.startsWith(ownLegacyPrefix));

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
      userFolder: 'assets/',
      isSuperAdmin,
    });
  } catch (error: any) {
    console.error('Blob list error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch files' }, { status: 500 });
  }
}
