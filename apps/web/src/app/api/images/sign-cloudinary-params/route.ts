import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import cloudinary from '@/lib/cloudinary';
import config from '@/config';

export const dynamic = 'force-dynamic';

/**
 * Signs a direct-to-Cloudinary upload for the receive-stock invoice attachment.
 *
 * The client cannot hold the Cloudinary API secret, so it asks here for a signature
 * over the exact parameters it is about to send. Whoever holds a valid signature can
 * put files into the account, which is why this needs a session: the previous
 * version was open to the internet and let anyone upload at the account's expense.
 *
 * Signed parameters are fixed server-side (timestamp + a per-store folder) so a
 * caller cannot choose an arbitrary destination or overwrite someone else's asset.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiKey || !apiSecret || !config.cloudinaryCloudName) {
    console.error('[sign-cloudinary-params] Cloudinary credentials are not configured');
    return NextResponse.json({ success: false, message: 'File uploads are not configured' }, { status: 503 });
  }

  // session.user is the decoded API token (see NextAuth `session` callback), which
  // carries more than the UserDto type declares; read the tenancy fields loosely.
  const user = session.user as unknown as { storeCode?: string | null; userId?: string; id?: string | number };
  const scope = user.storeCode || user.userId || (user.id != null ? String(user.id) : '') || 'shared';

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `pms_invoices/${scope}`;

  // Every param the browser sends besides file/api_key/resource_type must be in the
  // signature or Cloudinary rejects the upload, so keep this list and the client's
  // FormData in step.
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);

  return NextResponse.json({
    success: true,
    data: { apiKey, cloudName: config.cloudinaryCloudName, timestamp, folder, signature },
  });
}
