'use client';

import CameraCaptureButton, {
  CameraCaptureDialog,
  CameraFacing,
  openNativeCamera,
  useCameraAvailability,
} from '@/components/common/admin-media/camera-capture';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useBlobUpload, useGetAllMedia } from '@/hooks/service-hooks/useMediaService';
import { BLOB_MAX_SIZE_MB, UPLOAD_KIND_ACCEPT, UPLOAD_KIND_LABEL, UploadKind } from '@/lib/blob-upload';
import { mediaName, mediaUrl } from '@/lib/media-url';
import { cn } from '@/lib/utils';
import {
  Camera,
  Check,
  ExternalLink,
  FileText,
  FolderOpen,
  ImagePlus,
  Loader2,
  RefreshCw,
  Star,
  Trash2,
  UploadCloud,
  User,
  X,
} from 'lucide-react';
import { DragEvent, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * THE file-upload field: every form in the app uses this one component. It covers
 * - one file or many (`multiple`), image/doc/any (`kind`),
 * - click, drag & drop, and a camera option on any device that has one,
 * - an optional "Choose from gallery" over the media library (`withGallery`),
 * - an avatar presentation for profile photos (`shape="avatar"`),
 * - and a custom upload route when the default private-blob upload is wrong for the
 *   field (`uploadOverride`, e.g. the store logo's public branding route).
 * `value` is the single source of truth, so it drops straight into a react-hook-form FormField.
 */

interface BaseProps {
  /** What may be uploaded: image (default), doc, or any. Drives picker filter + validation. */
  kind?: UploadKind;
  /** Sub-folder inside the signed-in user's own blob prefix, e.g. "products". */
  folder?: string;
  maxSizeMb?: number;
  /** What the file is, for copy: "logo", "product image", "profile photo". */
  label?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
  /** Single mode only: "box" (default) or a round "avatar" for profile photos. */
  shape?: 'box' | 'avatar';
  /** Offers "Choose from gallery" over the media library. Images only. */
  withGallery?: boolean;
  /** The camera option is on by default for images; pass false to hide it. */
  withCamera?: boolean;
  /** "user" points phones at the selfie camera (profile photos). */
  cameraFacing?: CameraFacing;
  /** Replaces the default blob upload for fields with their own route; returns the stored URL. */
  uploadOverride?: (file: File) => Promise<string | null>;
}

interface SingleFileUploadProps extends BaseProps {
  multiple?: false;
  value: string | null | undefined;
  onChange: (url: string) => void;
}

interface MultiFileUploadProps extends BaseProps {
  multiple: true;
  value: string[];
  onChange: (urls: string[]) => void;
}

export type FileUploadProps = SingleFileUploadProps | MultiFileUploadProps;

export function FileUpload(props: FileUploadProps) {
  const {
    kind = 'image',
    folder,
    maxSizeMb = BLOB_MAX_SIZE_MB,
    label = 'file',
    hint,
    disabled,
    className,
    shape = 'box',
    withGallery = false,
    cameraFacing = 'environment',
    uploadOverride,
  } = props;

  const blob = useBlobUpload({ kind, maxSizeMb, ...(folder ? { folder } : {}) });
  const [overrideBusy, setOverrideBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraMode = useCameraAvailability();

  const isUploading = blob.isUploading || overrideBusy;
  const locked = disabled || isUploading;
  const percent = Object.values(blob.progress)[0];
  const hasCamera = (props.withCamera ?? true) && kind === 'image' && cameraMode !== null && cameraMode !== 'none';
  const hasGallery = withGallery && kind === 'image';

  const uploadOne = async (file: File): Promise<string | null> => {
    if (!uploadOverride) return blob.uploadUrl(file);
    setOverrideBusy(true);
    try {
      return await uploadOverride(file);
    } catch (error) {
      toast.error((error as Error)?.message || `Failed to upload ${label}`);
      return null;
    } finally {
      setOverrideBusy(false);
    }
  };

  // What gets persisted is the bare file name (mediaName); full URLs are rebuilt at read time.
  const applyUrls = (urls: string[]): boolean => {
    if (!urls.length) return false;
    const stored = urls.map(mediaName);
    if (props.multiple) props.onChange([...(props.value ?? []), ...stored]);
    else props.onChange(stored[0]);
    toast.success(urls.length === 1 ? `Uploaded ${label}` : `${urls.length} files uploaded`);
    return true;
  };

  const handleFiles = async (files: FileList | File[] | null): Promise<boolean> => {
    const list = files ? Array.from(files) : [];
    if (!list.length || locked) return false;
    try {
      if (props.multiple && !uploadOverride) return applyUrls(await blob.uploadUrls(list));
      if (props.multiple) {
        const urls: string[] = [];
        for (const file of list) {
          const url = await uploadOne(file);
          if (url) urls.push(url);
        }
        return applyUrls(urls);
      }
      const url = await uploadOne(list[0]);
      return applyUrls(url ? [url] : []);
    } finally {
      // Reset so picking the SAME file again still fires onChange.
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const takePhoto = async () => {
    if (cameraMode === 'native') {
      const file = await openNativeCamera(cameraFacing);
      if (file) await handleFiles([file]);
      return;
    }
    setCameraOpen(true);
  };

  const pickFromGallery = (url: string) => {
    const stored = mediaName(url);
    if (props.multiple) props.onChange([...(props.value ?? []), stored]);
    else props.onChange(stored);
    setGalleryOpen(false);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void handleFiles(event.dataTransfer.files);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!locked) setIsDragging(true);
  };

  const hiddenInput = (
    <input
      type="file"
      ref={fileInputRef}
      onChange={(event) => void handleFiles(event.target.files)}
      accept={UPLOAD_KIND_ACCEPT[kind]}
      multiple={props.multiple === true}
      className="hidden"
      disabled={locked}
    />
  );

  const dialogs = (
    <>
      {cameraOpen && (
        <CameraCaptureDialog
          isOpen={cameraOpen}
          onClose={() => setCameraOpen(false)}
          label={label}
          facingMode={cameraFacing}
          busy={isUploading}
          onCapture={async (file) => {
            const uploaded = await handleFiles([file]);
            if (uploaded) setCameraOpen(false);
            return uploaded;
          }}
        />
      )}
      {galleryOpen && (
        <GalleryDialog
          isOpen={galleryOpen}
          selected={props.multiple ? null : mediaUrl(props.value) || null}
          onClose={() => setGalleryOpen(false)}
          onSelect={pickFromGallery}
        />
      )}
    </>
  );

  // ---- Avatar presentation (single image, round) ----
  if (!props.multiple && shape === 'avatar') {
    const value = props.value ?? '';
    return (
      <div className={cn('group relative w-fit', className)}>
        {hiddenInput}
        <div
          onDragOver={onDragOver}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => !locked && fileInputRef.current?.click()}
          className={cn(
            'relative flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-background bg-muted shadow-xl ring-2 ring-primary/10 transition-all duration-300 group-hover:scale-105 group-hover:ring-primary/45',
            isDragging && 'scale-105 border-primary/50 ring-primary'
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value ? <img src={mediaUrl(value)} alt={label} className="h-full w-full object-cover" /> : <User className="h-14 w-14 text-muted-foreground/60" />}

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <Camera className="h-6 w-6" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Change photo</span>
          </div>

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-[2px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        {hasCamera && !isUploading && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              void takePhoto();
            }}
            className="absolute -bottom-1 -left-1 h-8 w-8 scale-90 rounded-full shadow-md transition-transform hover:scale-100"
            title="Take photo"
          >
            <Camera className="h-4 w-4" />
          </Button>
        )}

        {value && !isUploading && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              props.onChange('');
            }}
            className="absolute -bottom-1 -right-1 h-8 w-8 scale-90 rounded-full shadow-md transition-transform hover:scale-100"
            title="Remove photo"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}

        {dialogs}
      </div>
    );
  }

  // ---- Multiple images: grid with primary star, add-more and camera tiles ----
  if (props.multiple) {
    const value = props.value ?? [];

    const removeImage = (index: number) => {
      const updated = [...value];
      updated.splice(index, 1);
      props.onChange(updated);
    };

    // The first image is the primary one everywhere the list is read.
    const makePrimary = (index: number) => {
      if (index === 0) return;
      const updated = [...value];
      const [picked] = updated.splice(index, 1);
      updated.unshift(picked);
      props.onChange(updated);
    };

    return (
      <div className={cn('space-y-3', className)}>
        {hiddenInput}

        {value.length === 0 && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => !locked && fileInputRef.current?.click()}
            onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && !locked && fileInputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors',
              locked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
              isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            <div className={cn('rounded-full p-3', isDragging ? 'bg-primary/10 text-primary' : 'bg-background text-muted-foreground')}>
              {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">
                {isUploading ? 'Uploading…' : isDragging ? 'Drop files here' : 'Click or drag files to upload'}
              </p>
              <p className="text-xs text-muted-foreground">{hint ?? `${UPLOAD_KIND_LABEL[kind]} up to ${maxSizeMb}MB each`}</p>
            </div>
          </div>
        )}

        {value.length === 0 && (hasCamera || hasGallery) && (
          <div className="flex flex-wrap gap-2">
            {hasCamera && (
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" disabled={locked} onClick={() => void takePhoto()}>
                <Camera className="h-3.5 w-3.5" />
                Take photo
              </Button>
            )}
            {hasGallery && (
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" disabled={locked} onClick={() => setGalleryOpen(true)}>
                <FolderOpen className="h-3.5 w-3.5" />
                Choose from gallery
              </Button>
            )}
          </div>
        )}

        {value.length > 0 && (
          <div
            onDragOver={onDragOver}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={cn('grid grid-cols-3 gap-3 rounded-xl sm:grid-cols-4 md:grid-cols-5', isDragging && 'outline-dashed outline-2 outline-primary/60')}
          >
            {value.map((url, index) => (
              <div key={`${url}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(url)} alt={`${label}-${index}`} className="h-full w-full object-cover" />

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

            <button
              type="button"
              onClick={() => !locked && fileInputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
              <span className="text-[10px] font-medium">{isUploading ? 'Uploading…' : 'Add more'}</span>
            </button>

            {hasCamera && (
              <button
                type="button"
                onClick={() => !locked && void takePhoto()}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                <Camera className="h-5 w-5" />
                <span className="text-[10px] font-medium">Take photo</span>
              </button>
            )}
          </div>
        )}

        {dialogs}
      </div>
    );
  }

  // ---- Single file, box presentation ----
  const value = props.value ?? '';
  const isImageValue = kind === 'image' || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(value);
  const fileName = value ? decodeURIComponent(value.split('/').pop() || '').replace(/^\d{10,}-/, '') : '';

  return (
    <div className={cn('space-y-2', className)}>
      {hiddenInput}

      {value ? (
        <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-background">
            {isImageValue ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(value)} alt={label} className="h-full w-full object-contain" />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </span>
            )}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-[2px]">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="truncate text-xs text-muted-foreground" title={value}>
              {fileName || value}
              <a href={mediaUrl(value)} target="_blank" rel="noopener noreferrer" className="ml-1.5 inline-flex items-center gap-0.5 text-primary hover:underline">
                View <ExternalLink className="h-3 w-3" />
              </a>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={locked} className="h-8 gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Replace
              </Button>
              {hasCamera && <CameraCaptureButton onCapture={(file) => handleFiles([file])} label={label} facingMode={cameraFacing} busy={isUploading} disabled={locked} text="Retake" />}
              {hasGallery && (
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" disabled={locked} onClick={() => setGalleryOpen(true)}>
                  <FolderOpen className="h-3.5 w-3.5" />
                  Gallery
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => props.onChange('')}
                disabled={locked}
                title={`Remove ${label}`}
                className="h-8 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            role="button"
            tabIndex={locked ? -1 : 0}
            aria-disabled={locked}
            onClick={() => !locked && fileInputRef.current?.click()}
            onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && !locked && fileInputRef.current?.click()}
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
              {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">
                {isUploading ? `Uploading${percent != null ? ` ${percent}%` : '…'}` : isDragging ? 'Drop it here' : `Click or drag a ${label} to upload`}
              </p>
              <p className="text-xs text-muted-foreground">{hint ?? `${UPLOAD_KIND_LABEL[kind]} up to ${maxSizeMb}MB`}</p>
            </div>
          </div>

          {(hasCamera || hasGallery) && (
            <div className="flex flex-wrap gap-2">
              {hasCamera && <CameraCaptureButton onCapture={(file) => handleFiles([file])} label={label} facingMode={cameraFacing} busy={isUploading} disabled={locked} />}
              {hasGallery && (
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" disabled={locked} onClick={() => setGalleryOpen(true)}>
                  <FolderOpen className="h-3.5 w-3.5" />
                  Choose from gallery
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {dialogs}
    </div>
  );
}

interface GalleryDialogProps {
  isOpen: boolean;
  selected: string | null;
  onClose: () => void;
  onSelect: (url: string) => void;
}

/** Picks an image from the media library the Media page manages. */
function GalleryDialog({ isOpen, selected, onClose, onSelect }: GalleryDialogProps) {
  const [search, setSearch] = useState('');
  const mediaQuery = useGetAllMedia(isOpen);

  const images = useMemo(() => {
    // The list endpoint has no MIME metadata, so an image is recognised by its extension.
    const all = (mediaQuery.data?.images ?? []).filter((item) => /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(item.pathname));
    const needle = search.trim().toLowerCase();
    return needle ? all.filter((item) => item.pathname.toLowerCase().includes(needle)) : all;
  }, [mediaQuery.data, search]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose from gallery</DialogTitle>
          <DialogDescription>Pick an image from your media library. Manage the library under Admin → Media.</DialogDescription>
        </DialogHeader>

        <Input placeholder="Search by file name…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9" />

        {mediaQuery.isPending ? (
          <div className="grid max-h-[50vh] grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {search ? 'No images match this search.' : 'Your media library is empty - upload images on the Media page first.'}
          </p>
        ) : (
          <div className="grid max-h-[50vh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
            {images.map((item) => {
              const isSelected = item.url === selected;
              return (
                <button
                  key={item.pathname}
                  type="button"
                  onClick={() => onSelect(item.url)}
                  className={cn(
                    'group relative aspect-square overflow-hidden rounded-md border transition-all hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isSelected && 'border-primary ring-2 ring-primary/40'
                  )}
                  title={item.pathname}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  {isSelected && (
                    <span className="absolute right-1 top-1 rounded-full bg-primary p-0.5 text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default FileUpload;
