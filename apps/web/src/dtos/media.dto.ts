export interface UploadedMediaDto {
  public_id: string;
  format: string;
  version: number;
  resource_type: string;
  type: string;
  created_at: string;
  bytes: number;
  width: number;
  height: number;
  folder: string;
  url: string;
  secure_url: string;
}

export interface UploadMediaResponse {
  success: boolean;
  message?: string;
  data?: UploadedMediaDto;
}

export interface ListMediaResponse {
  success: boolean;
  message?: string;
  images?: UploadedMediaDto[];
  userFolder?: string;
  isSuperAdmin?: boolean;
}

export interface DeleteMediaResponse {
  success: boolean;
  message?: string;
  result?: { result?: string };
}
