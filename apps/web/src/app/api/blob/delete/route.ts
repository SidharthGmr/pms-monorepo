import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { del } from '@vercel/blob';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { Roles } from '@pms/types';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as any;
    const userId = user.id ?? user.userId;

    const { pathname } = await req.json();
    if (!pathname || typeof pathname !== 'string' || !pathname.startsWith('uploads/')) {
      return NextResponse.json({ success: false, message: 'pathname is required' }, { status: 400 });
    }

    // A regular admin can only delete files inside their own prefix; the super admin can
    // delete anything under uploads/ - the same rule the list route scopes by.
    const isSuperAdmin = user.role === Roles.SUPER_ADMIN;
    if (!isSuperAdmin && !pathname.startsWith(`uploads/user_${userId}/`)) {
      return NextResponse.json({ success: false, message: 'Unauthorized: You can only delete your own files' }, { status: 403 });
    }

    await del(pathname);

    return NextResponse.json({ success: true, message: 'File deleted successfully' });
  } catch (error: any) {
    console.error('Blob delete error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to delete file' }, { status: 500 });
  }
}
