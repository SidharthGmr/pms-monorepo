'use client';

import React, { useRef, useState, DragEvent } from 'react';
import { Camera, ImagePlus, Loader2, Star, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';
import { CameraCaptureDialog, openNativeCamera, useCameraAvailability } from '@/components/common/admin-media/camera-capture';
import { Button } from '@/components/ui/button';
import { useImageUpload } from '@/hooks/service-hooks/useMediaService';
import { cn } from '@/lib/utils';

interface ProductImageUploaderProps {
  value: string[];
  onChange: (value: string[]) => void;
  /** Max file size in MB. */
  maxSizeMb?: number;
  /** Sub-folder the images are filed under, inside the signed-in admin's own media folder.
   *  Created on first upload. Leave unset to drop them straight into that folder. */
  folder?: string;
}

// Narrows the OS file picker. Size and MIME are enforced again by useImageUpload, which is
// what catches a file dragged straight onto the dropzone.
const ACCEPTED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

export function ProductImageUploader({ value = [], onChange, maxSizeMb = 5, folder }: ProductImageUploaderProps) {
  const { uploadUrls, isUploading } = useImageUpload({ maxSizeMb, ...(folder ? { folder } : {}) });
  const [isDragging, setIsDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraMode = useCameraAvailability();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return false;

    try {
      const uploaded = await uploadUrls(files);
      if (uploaded.length) {
        onChange([...value, ...uploaded]);
        toast.success(`${uploaded.length} image${uploaded.length === 1 ? '' : 's'} uploaded`);
        return true;
      }
      return false;
    } finally {
      // Reset so selecting the SAME file again still fires onChange.
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // A shot keeps its place in the list like any other upload: appended, and primary only if it
  // happens to be the first image.
  const takePhoto = async () => {
    if (cameraMode === 'native') {
      const file = await openNativeCamera();
      if (file) await handleFiles([file]);
      return;
    }
    setCameraOpen(true);
  };

  const hasCamera = cameraMode !== null && cameraMode !== 'none';

  const removeImage = (index: number) => {
    const updated = [...value];
    updated.splice(index, 1);
    onChange(updated);
  };

  const makePrimary = (index: number) => {
    if (index === 0) return;
    const updated = [...value];
    const [picked] = updated.splice(index, 1);
    updated.unshift(picked);
    onChange(updated);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isUploading) handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        multiple
        accept={ACCEPTED.join(',')}
        className="hidden"
      />

      {/* Dropzone - empty state only; with images present the grid below is the drop target. */}
      {value.length === 0 && (
      <div
        role="button"
        tabIndex={0}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !isUploading && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors',
          isUploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
          isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        <div className={cn('rounded-full p-3', isDragging ? 'bg-primary/10 text-primary' : 'bg-background text-muted-foreground')}>
          {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground">
            {isUploading ? 'Uploading…' : isDragging ? 'Drop images here' : 'Click or drag images to upload'}
          </p>
          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP or GIF · up to {maxSizeMb}MB each</p>
        </div>
      </div>
      )}

      {value.length === 0 && hasCamera && (
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" disabled={isUploading} onClick={() => void takePhoto()}>
          <Camera className="h-3.5 w-3.5" />
          Take photo
        </Button>
      )}

      {/* Previews */}
      {value.length > 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={cn('grid grid-cols-3 gap-3 rounded-xl sm:grid-cols-4 md:grid-cols-5', isDragging && 'outline-dashed outline-2 outline-primary/60')}
        >
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`product-${index}`} className="h-full w-full object-cover" />

              {index === 0 && (
                <span className="absolute left-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  Primary
                </span>
              )}

              <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/55 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => makePrimary(index)}
                    title="Make primary"
                    className="rounded-full bg-white/15 p-1.5 text-white transition-colors hover:bg-white/30"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  title="Remove"
                  className="rounded-full bg-white/15 p-1.5 text-white transition-colors hover:bg-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add more tile */}
          <button
            type="button"
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            <span className="text-[10px] font-medium">{isUploading ? 'Uploading…' : 'Add more'}</span>
          </button>

          {hasCamera && (
            <button
              type="button"
              onClick={() => !isUploading && void takePhoto()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <Camera className="h-5 w-5" />
              <span className="text-[10px] font-medium">Take photo</span>
            </button>
          )}
        </div>
      )}

      {cameraOpen && (
        <CameraCaptureDialog
          isOpen={cameraOpen}
          onClose={() => setCameraOpen(false)}
          label="product photo"
          busy={isUploading}
          onCapture={async (file) => {
            const uploaded = await handleFiles([file]);
            if (uploaded) setCameraOpen(false);
            return uploaded;
          }}
        />
      )}
    </div>
  );
}
