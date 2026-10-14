import { DeleteMediaResponse, ListMediaResponse, UploadMediaResponse } from '@/dtos/media.dto';

export interface UploadMediaOptions {
  /** Fired with 0-100 as the request body is sent. */
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
  /** Sub-folder to file the upload under, inside the caller's own media folder. Created on
   *  first use; the route sanitizes it, so an unusable name simply falls back to the root. */
  folder?: string;
}

export default interface IMediaService {
  upload(file: File, options?: UploadMediaOptions): Promise<UploadMediaResponse>;
  getAll(signal?: AbortSignal): Promise<ListMediaResponse>;
  delete(publicId: string): Promise<DeleteMediaResponse>;
}
