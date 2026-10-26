/**
 * A file stored in the private Vercel Blob store. `url` is this app's authenticated
 * serving route (/api/blob/view/<pathname>), not the blob's own URL - the store is
 * private, so the raw blob URL is not fetchable by a browser.
 */
export interface BlobFileDto {
  url: string;
  pathname: string;
  contentType?: string;
  size?: number;
  /** ISO timestamp (Dates are serialized on the wire). */
  uploadedAt?: Date | string;
}

export interface BlobUploadResponse {
  success: boolean;
  message?: string;
  data?: BlobFileDto;
}

export interface ListMediaResponse {
  success: boolean;
  message?: string;
  images?: BlobFileDto[];
  /** The blob prefix the listing was scoped to, e.g. uploads/user_<id>/. */
  userFolder?: string;
  isSuperAdmin?: boolean;
}

export interface DeleteMediaResponse {
  success: boolean;
  message?: string;
}
