import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { get } from '@vercel/blob';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

export const dynamic = 'force-dynamic';

/**
 * Serves files from the PRIVATE Vercel Blob store. The blob's own URL is not publicly
 * fetchable, so every <img src> / download link in the app points here instead; the NextAuth
 * session cookie rides along on same-origin requests, which is the whole access check.
 */
export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  const pathname = (params.path ?? []).join('/');

  // `branding/` holds only the admin-uploaded logo, which must load with no session (emails,
  // invoice PDFs, the public storefront); everything else requires a signed-in user.
  const isPublicBranding = pathname.startsWith('branding/');
  if (!isPublicBranding) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Only the namespaces the upload route writes to are servable - anything else 404s so the
    // route cannot be used to probe the rest of the store. uploads/ is the legacy prefix.
    if (!pathname.startsWith('assets/') && !pathname.startsWith('uploads/')) {
      return NextResponse.json({ success: false, message: 'File not found' }, { status: 404 });
    }
  }

  try {
    const file = await get(pathname, { access: 'private' });

    if (!file || file.statusCode !== 200 || !file.stream) {
      return NextResponse.json({ success: false, message: 'File not found' }, { status: 404 });
    }

    return new Response(file.stream, {
      headers: {
        'Content-Type': file.blob?.contentType || 'application/octet-stream',
        'Content-Disposition': 'inline',
        // The logo is public and its filename is timestamped, so caches may keep it for a day;
        // everything else needs a session to fetch, so only the browser cache may keep it.
        'Cache-Control': isPublicBranding ? 'public, max-age=86400' : 'private, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Blob view error:', error);
    return NextResponse.json({ success: false, message: 'Failed to load file' }, { status: 500 });
  }
}
