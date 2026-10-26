/**
 * Shared rules for uploads to the private Vercel Blob store. The /api/blob/upload route,
 * the useBlobUpload hook and the FileUploader component all read these, so what the client
 * pre-checks and what the server enforces can never drift apart.
 */
export type UploadKind = 'image' | 'doc' | 'any';

// Vercel route handlers cap request bodies at ~4.5MB, so the app-level ceiling stays under it.
export const BLOB_MAX_SIZE_MB = 4;

/** Value for an <input type="file"> accept attribute, per kind. `any` leaves it unset. */
export const UPLOAD_KIND_ACCEPT: Record<UploadKind, string | undefined> = {
  image: 'image/*',
  doc: '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt',
  any: undefined,
};

/** What the error toast calls the expected file type. */
export const UPLOAD_KIND_LABEL: Record<UploadKind, string> = {
  image: 'image',
  doc: 'document (pdf, doc, xls, csv, txt)',
  any: 'file',
};

const DOC_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
]);

const DOC_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt']);

/**
 * MIME-first with an extension fallback, because browsers report an empty MIME type for
 * some files (csv is the usual offender) and the server only ever sees what the browser sent.
 */
export function isAllowedUploadType(kind: UploadKind, file: { type: string; name: string }): boolean {
  if (kind === 'any') return true;
  if (kind === 'image') return file.type.startsWith('image/');

  if (file.type && DOC_MIME_TYPES.has(file.type)) return true;
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return DOC_EXTENSIONS.has(extension);
}

export function isUploadKind(value: unknown): value is UploadKind {
  return value === 'image' || value === 'doc' || value === 'any';
}
