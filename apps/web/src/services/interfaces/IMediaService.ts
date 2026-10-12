import { DeleteMediaResponse, ListMediaResponse, UploadMediaResponse } from '@/dtos/media.dto';

export interface UploadMediaOptions {
  /** Fired with 0-100 as the request body is sent. */
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export default interface IMediaService {
  upload(file: File, options?: UploadMediaOptions): Promise<UploadMediaResponse>;
  getAll(signal?: AbortSignal): Promise<ListMediaResponse>;
  delete(publicId: string): Promise<DeleteMediaResponse>;
}
