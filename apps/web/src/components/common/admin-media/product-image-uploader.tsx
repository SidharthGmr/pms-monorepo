'use client';

import React, { useRef, useState, DragEvent } from 'react';
import { ImagePlus, Loader2, Star, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProductImageUploaderProps {
  value: string[];
  onChange: (value: string[]) => void;
  /** Max file size in MB. */
  maxSizeMb?: number;
}

const ACCEPTED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

export function ProductImageUploader({ value = [], onChange, maxSizeMb = 5 }: ProductImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadOne = async (file: File): Promise<string | null> => {
    if (!ACCEPTED.includes(file.type)) {
      toast.error(`${file.name}: unsupported file type`);
      return null;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error(`${file.name}: exceeds ${maxSizeMb}MB`);
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/admin-media/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success && data.data?.secure_url) {
      return data.data.secure_url as string;
    }
    toast.error(data.message || `Failed to upload ${file.name}`);
    return null;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        try {
          const url = await uploadOne(files[i]);
          if (url) uploaded.push(url);
        } catch (err) {
          console.error(err);
          toast.error(`Error uploading ${files[i].name}`);
        }
      }
      if (uploaded.length) {
        onChange([...value, ...uploaded]);
        toast.success(`${uploaded.length} image${uploaded.length === 1 ? '' : 's'} uploaded`);
      }
    } finally {
      setIsUploading(false);
      // Reset so selecting the SAME file again still fires onChange.
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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

      {/* Dropzone */}
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

      {/* Previews */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
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
            <ImagePlus className="h-5 w-5" />
            <span className="text-[10px] font-medium">Add more</span>
          </button>
        </div>
      )}
    </div>
  );
}
