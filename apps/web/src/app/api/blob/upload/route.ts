import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { put } from '@vercel/blob';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { BLOB_MAX_SIZE_MB, isAllowedUploadType, isUploadKind, UPLOAD_KIND_LABEL, UploadKind } from '@/lib/blob-upload';

export const dynamic = 'force-dynamic';

// A caller-supplied folder is untrusted input: it is reduced to a plain relative sub-path and
// always nested under the signed-in user's own prefix, so an upload can never land outside the
// namespace the view, list and delete routes scope by.
const MAX_FOLDER_DEPTH = 2;
const MAX_SEGMENT_LENGTH = 50;

const sanitizeFolder = (raw: FormDataEntryValue | null): string => {
  if (typeof raw !== 'string') return '';
  return raw
    .split('/')
    .map((segment) =>
      segment
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-_]/g, '')
    )
    .filter((segment) => segment.length > 0)
    .slice(0, MAX_FOLDER_DEPTH)
    .map((segment) => segment.slice(0, MAX_SEGMENT_LENGTH))
    .join('/');
};

// Keeps only filesystem/URL-safe characters so the pathname round-trips through the catch-all
// view route without any encoding surprises.
const sanitizeFileName = (name: string): string => {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/\.{2,}/g, '.');
  return cleaned.slice(-100) || 'file';
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as any;
    const userId = user.id ?? user.userId;
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    const rawKind = formData.get('kind');
    const kind: UploadKind = isUploadKind(rawKind) ? rawKind : 'image';

    // Server-side checks mirror the client hook - the hook is a convenience, this is the gate.
    if (!isAllowedUploadType(kind, file)) {
      return NextResponse.json({ success: false, message: `Only ${UPLOAD_KIND_LABEL[kind]} files are allowed` }, { status: 400 });
    }
    if (file.size > BLOB_MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ success: false, message: `File exceeds ${BLOB_MAX_SIZE_MB}MB` }, { status: 400 });
    }

    const userFolder = `uploads/user_${userId}`;
    const subFolder = sanitizeFolder(formData.get('folder'));
    const pathname = `${subFolder ? `${userFolder}/${subFolder}` : userFolder}/${Date.now()}-${sanitizeFileName(file.name)}`;

    const blob = await put(pathname, file, {
      access: 'private',
      addRandomSuffix: false,
      ...(file.type ? { contentType: file.type } : {}),
    });

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        // The store is private, so the usable URL is this app's authenticated serving route.
        url: `/api/blob/view/${blob.pathname}`,
        pathname: blob.pathname,
        contentType: file.type || undefined,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Blob upload error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to upload file' }, { status: 500 });
  }
}
