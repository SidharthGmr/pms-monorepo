'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAllMedia, useImageUpload } from '@/hooks/service-hooks/useMediaService';
import { cn } from '@/lib/utils';
import { Check, FolderOpen, ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

interface ImagePickerProps {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  /** What the image is for, used in labels, e.g. "thumbnail". */
  label?: string;
  maxSizeMb?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Single-image form field: preview, replace and remove, with two sources - a direct upload
 * (useImageUpload, Cloudinary via /api/admin-media) and "Choose from gallery", a dialog over
 * the same media library the Media page manages (useGetAllMedia).
 */
export default function ImagePicker({ value, onChange, label = 'image', maxSizeMb = 5, disabled, className }: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const { uploadUrl, isUploading } = useImageUpload({ maxSizeMb });

  const pickFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const url = await uploadUrl(file);
    if (url) onChange(url);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {value ? (
        <div className="group relative w-fit overflow-hidden rounded-lg border bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-32 w-48 object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Button type="button" size="sm" variant="secondary" className="h-8 gap-1" disabled={disabled} onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" />
              Replace
            </Button>
            <Button type="button" size="icon" variant="destructive" className="h-8 w-8" disabled={disabled} onClick={() => onChange(null)} title={`Remove ${label}`}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex h-32 w-48 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground/60">
          <ImageIcon className="h-6 w-6" />
          <span className="text-[11px]">No {label} yet</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5" disabled={disabled || isUploading} onClick={() => fileInputRef.current?.click()}>
          {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {isUploading ? 'Uploading…' : 'Upload image'}
        </Button>
        <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5" disabled={disabled} onClick={() => setGalleryOpen(true)}>
          <FolderOpen className="h-3.5 w-3.5" />
          Choose from gallery
        </Button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void pickFile(e.target.files)} />

      {galleryOpen && (
        <GalleryDialog
          isOpen={galleryOpen}
          selected={value ?? null}
          onClose={() => setGalleryOpen(false)}
          onSelect={(url) => {
            onChange(url);
            setGalleryOpen(false);
          }}
        />
      )}
    </div>
  );
}

interface GalleryDialogProps {
  isOpen: boolean;
  selected: string | null;
  onClose: () => void;
  onSelect: (url: string) => void;
}

function GalleryDialog({ isOpen, selected, onClose, onSelect }: GalleryDialogProps) {
  const [search, setSearch] = useState('');
  const mediaQuery = useGetAllMedia(isOpen);

  const images = useMemo(() => {
    const all = (mediaQuery.data?.images ?? []).filter((item) => item.resource_type === 'image');
    const needle = search.trim().toLowerCase();
    return needle ? all.filter((item) => item.public_id.toLowerCase().includes(needle)) : all;
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
              const isSelected = item.secure_url === selected;
              return (
                <button
                  key={item.public_id}
                  type="button"
                  onClick={() => onSelect(item.secure_url)}
                  className={cn(
                    'group relative aspect-square overflow-hidden rounded-md border transition-all hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isSelected && 'border-primary ring-2 ring-primary/40'
                  )}
                  title={item.public_id}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.secure_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
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
