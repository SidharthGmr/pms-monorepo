'use client';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';

import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { UploadedMediaDto } from '@pms/types';

export const MEDIA_QUERY_KEY = ['MediaService.getAll'];

export interface UseImageUploadOptions {
  /** Rejected before the request is made. Defaults to 5MB. */
  maxSizeMb?: number;
  /** Leading part of the MIME type a file must match, e.g. `image`. Pass null to allow anything. */
  accept?: string | null;
  /** Suppress the built-in toasts when the caller wants to report failures itself. */
  silent?: boolean;
  /** Sub-folder to file uploads under, inside the caller's own media folder. Created on first
   *  use. Leave unset to drop them straight into that folder. */
  folder?: string;
}

const DEFAULTS: Required<Omit<UseImageUploadOptions, 'accept' | 'folder'>> & { accept: string | null } = {
  maxSizeMb: 5,
  accept: 'image',
  silent: false,
};

/**
 * One place to upload a file to /api/admin-media/upload. Validation, progress and the error
 * toast live here so a page only deals with the URLs it gets back.
 */
export function useImageUpload(options?: UseImageUploadOptions) {
  const settings = { ...DEFAULTS, ...options };
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
    async (file: File, perCall?: { onProgress?: (percent: number) => void }): Promise<UploadedMediaDto | null> => {
      if (settings.accept && !file.type.startsWith(settings.accept)) {
        return fail(`${file.name}: only ${settings.accept} files are allowed`);
      }
      if (file.size > settings.maxSizeMb * 1024 * 1024) {
        return fail(`${file.name}: exceeds ${settings.maxSizeMb}MB`);
      }

      activeRef.current += 1;
      setIsUploading(true);
      setProgress((current) => ({ ...current, [file.name]: 0 }));

      try {
        const response = await unitOfService.MediaService.upload(file, {
          folder: settings.folder,
          onProgress: (percent) => {
            setProgress((current) => ({ ...current, [file.name]: percent }));
            perCall?.onProgress?.(percent);
          },
        });

        if (response.success && response.data?.secure_url) return response.data;
        return fail(response.message || `Failed to upload ${file.name}`);
      } catch (error) {
        return fail((error as Error)?.message || `Error uploading ${file.name}`);
      } finally {
        clearProgress(file.name);
        activeRef.current -= 1;
        if (activeRef.current === 0) setIsUploading(false);
      }
    },
    [unitOfService, settings.accept, settings.maxSizeMb, settings.folder, fail, clearProgress]
  );

  // Sequential on purpose: a dozen parallel Cloudinary uploads from one browser tab is how you
  // get rate-limited, and the progress map stays readable this way.
  const uploadMany = useCallback(
    async (files: FileList | File[]): Promise<UploadedMediaDto[]> => {
      const uploaded: UploadedMediaDto[] = [];
      for (const file of Array.from(files)) {
        const result = await upload(file);
        if (result) uploaded.push(result);
      }
      return uploaded;
    },
    [upload]
  );

  const uploadUrl = useCallback(async (file: File) => (await upload(file))?.secure_url ?? null, [upload]);

  const uploadUrls = useCallback(async (files: FileList | File[]) => (await uploadMany(files)).map((item) => item.secure_url), [uploadMany]);

  return { upload, uploadMany, uploadUrl, uploadUrls, isUploading, progress };
}

/** Every file in the caller's Cloudinary folder (all admins' folders for a super admin). */
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

/** Removes a file from Cloudinary and refreshes the list. The route refuses another admin's file. */
export function useDeleteMedia(options?: { silent?: boolean }) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (publicId: string) => {
      const response = await unitOfService.MediaService.delete(publicId);
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

export default useImageUpload;
