import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { isAllowedUploadType } from '@/lib/blob-upload';
import { Roles } from '@pms/types';
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';

/**
 * The branding logo lives in the same PRIVATE blob store as everything else (the store refuses
 * public writes), but it has to load with no session attached - in a customer's email client,
 * in a downloaded invoice PDF - so the view route serves the `branding/` namespace without
 * authentication. Nothing else is written here, and only an admin can write here at all.
 */

const MAX_LOGO_MB = 2;

const extensionFor = (file: File): string => {
  const fromName = file.name.includes('.') ? file.name.split('.').pop() : '';
  const cleaned = (fromName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (cleaned) return cleaned;
  return file.type === 'image/svg+xml' ? 'svg' : (file.type.split('/')[1] ?? 'png');
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string } | undefined;
    if (!user || (user.role !== Roles.ADMIN && user.role !== Roles.SUPER_ADMIN)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    if (!isAllowedUploadType('image', file)) {
      return NextResponse.json({ success: false, message: 'Only image files are allowed' }, { status: 400 });
    }
    if (file.size > MAX_LOGO_MB * 1024 * 1024) {
      return NextResponse.json({ success: false, message: `Logo must be ${MAX_LOGO_MB}MB or smaller` }, { status: 400 });
    }

    const blob = await put(`branding/logo-${Date.now()}.${extensionFor(file)}`, file, {
      access: 'private',
      addRandomSuffix: false,
      ...(file.type ? { contentType: file.type } : {}),
    });

    return NextResponse.json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        // Served session-free by the view route's branding carve-out; the email dispatcher
        // prefixes the site URL when it needs an absolute link.
        url: `/api/blob/view/${blob.pathname}`,
        pathname: blob.pathname,
        contentType: file.type || undefined,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Logo upload error:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Failed to upload logo' }, { status: 500 });
  }
}
