'use client';

import CameraCaptureButton from '@/components/common/admin-media/camera-capture';
import { Button } from '@/components/ui/button';
import { useImageUpload } from '@/hooks/service-hooks/useMediaService';
import { cn } from '@/lib/utils';
import { ImageOff, Loader2, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { DragEvent, useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * One image, one field. Uploads through `useImageUpload` into `folder` (a sub-folder of the
 * signed-in admin's own media folder, created on first upload) and hands the stored path back
 * through `onChange`. Nothing is kept in local state: `value` is the single source of truth, so
 * it drops straight into a react-hook-form `FormField`.
 */

const ACCEPTED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

export interface SingleImageUploadProps {
  /** Stored image path. Empty string when nothing is set yet. */
  value: string;
  /** Receives the uploaded image's path, or '' when the image is removed. */
  onChange: (path: string) => void;
  /** Sub-folder the image is filed under, e.g. `brands`. Created automatically when new. */
  folder?: string;
  /** Rejected before the request is made. Defaults to 5MB. */
  maxSizeMb?: number;
  /** Replaces the default "PNG, JPG…" line under the dropzone. */
  hint?: string;
  /** Alt text for the preview. */
  alt?: string;
  disabled?: boolean;
  className?: string;
}

export function SingleImageUpload({ value, onChange, folder, maxSizeMb = 5, hint, alt = 'Uploaded image', disabled = false, className }: SingleImageUploadProps) {
  const { upload, isUploading, progress } = useImageUpload({ maxSizeMb, ...(folder ? { folder } : {}) });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const percent = Object.values(progress)[0];
  const locked = disabled || isUploading;

  const openPicker = () => {
    if (!locked) fileInputRef.current?.click();
  };

  const handleFile = async (file: File | undefined) => {
    if (!file || locked) return false;
    try {
      const uploaded = await upload(file);
      if (uploaded?.secure_url) {
        onChange(uploaded.secure_url);
        toast.success('Image uploaded');
        return true;
      }
      return false;
    } finally {
      // Reset so picking the SAME file again still fires onChange.
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!locked) setIsDragging(true);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <input type="file" ref={fileInputRef} onChange={(e) => handleFile(e.target.files?.[0])} accept={ACCEPTED.join(',')} className="hidden" disabled={locked} />

      {value ? (
        <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-3">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={alt} className="h-full w-full object-contain" />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-[2px]">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <p className="truncate text-xs text-muted-foreground" title={value}>
              {value.split('/').pop()}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={openPicker} disabled={locked} className="h-8 gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Replace
              </Button>
              <CameraCaptureButton onCapture={handleFile} label="photo" busy={isUploading} disabled={locked} text="Retake" />
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')} disabled={locked} className="h-8 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={locked ? -1 : 0}
          aria-disabled={locked}
          onClick={openPicker}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openPicker()}
          onDragOver={onDragOver}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors',
            locked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
            isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
          )}
        >
          <div className={cn('rounded-full p-3', isDragging ? 'bg-primary/10 text-primary' : 'bg-background text-muted-foreground')}>
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : disabled ? <ImageOff className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">
              {isUploading ? `Uploading${percent != null ? ` ${percent}%` : '…'}` : isDragging ? 'Drop the image here' : 'Click or drag an image to upload'}
            </p>
            <p className="text-xs text-muted-foreground">{hint ?? `PNG, JPG, WEBP or SVG · up to ${maxSizeMb}MB`}</p>
          </div>
        </div>
      )}

      {!value && <CameraCaptureButton onCapture={handleFile} label="photo" busy={isUploading} disabled={locked} />}
    </div>
  );
}

export default SingleImageUpload;
