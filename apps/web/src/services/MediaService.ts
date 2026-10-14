import { DeleteMediaResponse, ListMediaResponse, UploadMediaResponse } from '@/dtos/media.dto';
import axios from 'axios';
import { injectable } from 'inversify';
import IMediaService, { UploadMediaOptions } from './interfaces/IMediaService';

const BASE = '/api/admin-media';

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
  async upload(file: File, options?: UploadMediaOptions): Promise<UploadMediaResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.folder) formData.append('folder', options.folder);

    try {
      const response = await axios.post<UploadMediaResponse>(`${BASE}/upload`, formData, {
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

  async getAll(signal?: AbortSignal): Promise<ListMediaResponse> {
    try {
      const response = await axios.get<ListMediaResponse>(`${BASE}/get-all`, { signal });
      return response.data;
    } catch (error) {
      return failure(error, 'Failed to fetch media');
    }
  }

  async delete(publicId: string): Promise<DeleteMediaResponse> {
    try {
      const response = await axios.delete<DeleteMediaResponse>(`${BASE}/delete`, { data: { publicId } });
      return response.data;
    } catch (error) {
      return failure(error, 'Failed to delete file');
    }
  }
}
