import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import cloudinary from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

// A caller-supplied folder is untrusted input: it is reduced to a plain relative sub-path and
// always nested under the admin's own folder, so an upload can never land outside the namespace
// that the get-all and delete routes use to keep one admin's files away from another's.
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as any;

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Dynamically create folder for each admin based on their id, optionally sub-divided by the
    // folder the caller asked for. Cloudinary creates any missing folder in the path as part of
    // the upload, so an unknown folder name needs no separate "does this exist yet" round trip.
    const adminFolder = `assets/admin_${user.id}`;
    const subFolder = sanitizeFolder(formData.get('folder'));
    const folder = subFolder ? `${adminFolder}/${subFolder}` : adminFolder;

    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const result = await uploadPromise;

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to upload file' }, { status: 500 });
  }
}
