import axios from 'axios';
import { injectable } from 'inversify';
import IMediaService, { UploadBlobOptions } from './interfaces/IMediaService';
import { BlobUploadResponse, DeleteMediaResponse, ListMediaResponse } from '@pms/types';

const BASE = '/api/blob';

// These are Next's own route handlers, not the Express API: they authenticate with the NextAuth
// session cookie, so this deliberately does not go through HttpService and its bearer token.
const failure = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { message?: string } | undefined;
    return { success: false as const, message: body?.message || error.message || fallback };
  }
  return { success: false as const, message: (error as Error)?.message || fallback };
};

@injectable()
export default class MediaService implements IMediaService {
  async uploadBlob(file: File, options?: UploadBlobOptions): Promise<BlobUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.folder) formData.append('folder', options.folder);
    if (options?.kind) formData.append('kind', options.kind);

    try {
      const response = await axios.post<BlobUploadResponse>(`${BASE}/upload`, formData, {
        signal: options?.signal,
        onUploadProgress: (event) => {
          if (!options?.onProgress || !event.total) return;
          options.onProgress(Math.round((event.loaded / event.total) * 100));
        },
      });
      return response.data;
    } catch (error) {
      return failure(error, 'Failed to upload file');
    }
  }

  async uploadLogo(file: File, options?: Pick<UploadBlobOptions, 'onProgress' | 'signal'>): Promise<BlobUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post<BlobUploadResponse>(`${BASE}/logo`, formData, {
        signal: options?.signal,
        onUploadProgress: (event) => {
          if (!options?.onProgress || !event.total) return;
          options.onProgress(Math.round((event.loaded / event.total) * 100));
        },
      });
      return response.data;
    } catch (error) {
      return failure(error, 'Failed to upload logo');
    }
  }

  async getAll(signal?: AbortSignal): Promise<ListMediaResponse> {
    try {
      const response = await axios.get<ListMediaResponse>(`${BASE}/list`, { signal });
      return response.data;
    } catch (error) {
      return failure(error, 'Failed to fetch media');
    }
  }

  async delete(pathname: string): Promise<DeleteMediaResponse> {
    try {
      const response = await axios.delete<DeleteMediaResponse>(`${BASE}/delete`, { data: { pathname } });
      return response.data;
    } catch (error) {
      return failure(error, 'Failed to delete file');
    }
  }
}
