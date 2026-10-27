'use client';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';

import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { BlobFileDto } from '@pms/types';
import { BLOB_MAX_SIZE_MB, isAllowedUploadType, UPLOAD_KIND_LABEL, UploadKind } from '@/lib/blob-upload';

export const MEDIA_QUERY_KEY = ['MediaService.getAll'];

export interface UseBlobUploadOptions {
  maxSizeMb?: number;
  kind?: UploadKind;
  silent?: boolean;
  folder?: string;
}

/**
 * One place to upload files to the private Vercel Blob store (/api/blob/upload). Validation,
 * progress and the error toast live here so a page only deals with the URLs it gets back -
 * and those URLs are this app's authenticated /api/blob/view route, not raw blob URLs.
 */
export function useBlobUpload(options?: UseBlobUploadOptions) {
  const settings = { maxSizeMb: BLOB_MAX_SIZE_MB, kind: 'image' as UploadKind, silent: false, ...options };
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const activeRef = useRef(0);

  const fail = useCallback(
    (message: string) => {
      if (!settings.silent) toast.error(message);
      return null;
    },
    [settings.silent]
  );

  const clearProgress = useCallback((name: string) => {
    setProgress((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
  }, []);

  const upload = useCallback(
    async (file: File, perCall?: { onProgress?: (percent: number) => void }): Promise<BlobFileDto | null> => {
      if (!isAllowedUploadType(settings.kind, file)) {
        return fail(`${file.name}: only ${UPLOAD_KIND_LABEL[settings.kind]} files are allowed`);
      }
      if (file.size > settings.maxSizeMb * 1024 * 1024) {
        return fail(`${file.name}: exceeds ${settings.maxSizeMb}MB`);
      }

      activeRef.current += 1;
      setIsUploading(true);
      setProgress((current) => ({ ...current, [file.name]: 0 }));

      try {
        const response = await unitOfService.MediaService.uploadBlob(file, {
          folder: settings.folder,
          kind: settings.kind,
          onProgress: (percent) => {
            setProgress((current) => ({ ...current, [file.name]: percent }));
            perCall?.onProgress?.(percent);
          },
        });

        if (response.success && response.data?.url) return response.data;
        return fail(response.message || `Failed to upload ${file.name}`);
      } catch (error) {
        return fail((error as Error)?.message || `Error uploading ${file.name}`);
      } finally {
        clearProgress(file.name);
        activeRef.current -= 1;
        if (activeRef.current === 0) setIsUploading(false);
      }
    },
    [unitOfService, settings.kind, settings.maxSizeMb, settings.folder, fail, clearProgress]
  );

  // Sequential on purpose: a dozen parallel uploads from one browser tab makes the progress
  // map unreadable and competes for the same upstream bandwidth anyway.
  const uploadMany = useCallback(
    async (files: FileList | File[]): Promise<BlobFileDto[]> => {
      const uploaded: BlobFileDto[] = [];
      for (const file of Array.from(files)) {
        const result = await upload(file);
        if (result) uploaded.push(result);
      }
      return uploaded;
    },
    [upload]
  );

  const uploadUrl = useCallback(async (file: File) => (await upload(file))?.url ?? null, [upload]);

  const uploadUrls = useCallback(async (files: FileList | File[]) => (await uploadMany(files)).map((item) => item.url), [uploadMany]);

  return { upload, uploadMany, uploadUrl, uploadUrls, isUploading, progress };
}

/** Every file in the caller's blob folder (all users' folders for a super admin). */
export function useGetAllMedia(enabled: boolean = true) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: MEDIA_QUERY_KEY,
    queryFn: async () => {
      const response = await unitOfService.MediaService.getAll();
      if (!response.success) throw new Error(response.message || 'Failed to load media');
      return response;
    },
    enabled,
  });
}

/** Removes a file from the blob store and refreshes the list. The route refuses another user's file. */
export function useDeleteMedia(options?: { silent?: boolean }) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pathname: string) => {
      const response = await unitOfService.MediaService.delete(pathname);
      if (!response.success) throw new Error(response.message || 'Failed to delete file');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEY });
      if (!options?.silent) toast.success('File deleted successfully');
    },
    onError: (error: Error) => {
      if (!options?.silent) toast.error(error.message || 'Error deleting file');
    },
  });
}

export default useBlobUpload;
