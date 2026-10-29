import { BlobUploadResponse, DeleteMediaResponse, ListMediaResponse } from '@pms/types';
import { UploadKind } from '@/lib/blob-upload';

export interface UploadBlobOptions {
  /** Fired with 0-100 as the request body is sent. */
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
  /** Sub-folder inside the caller's own blob prefix (uploads/user_<id>/). Sanitized server-side. */
  folder?: string;
  /** What the server accepts: image (default), doc, or any. */
  kind?: UploadKind;
}

export default interface IMediaService {
  /** Uploads to the private Vercel Blob store via /api/blob/upload. */
  uploadBlob(file: File, options?: UploadBlobOptions): Promise<BlobUploadResponse>;
  /** Uploads the branding logo to the PUBLIC blob store, so emails and PDFs can load it unauthenticated. */
  uploadLogo(file: File, options?: Pick<UploadBlobOptions, 'onProgress' | 'signal'>): Promise<BlobUploadResponse>;
  getAll(signal?: AbortSignal): Promise<ListMediaResponse>;
  delete(pathname: string): Promise<DeleteMediaResponse>;
}
