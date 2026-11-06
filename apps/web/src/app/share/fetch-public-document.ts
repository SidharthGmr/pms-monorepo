import config from '@/config';
import { CustomResponse, PublicDocumentDto } from '@pms/types';

/**
 * Server-side read of a shared document. Deliberately a plain fetch rather than HttpService:
 * the public routes take no clientId and no bearer token, and a visitor here has no session
 * to refresh. Never cached - a document the store has since edited must not be served stale.
 */
export async function fetchPublicDocument(kind: 'estimates' | 'orders', token: string): Promise<PublicDocumentDto | null> {
  try {
    const response = await fetch(`${config.apiBaseUrl}/public/${kind}/${encodeURIComponent(token)}`, { cache: 'no-store' });
    if (!response.ok) return null;
    const body = (await response.json()) as CustomResponse<PublicDocumentDto>;
    return body?.data ?? null;
  } catch {
    return null;
  }
}
