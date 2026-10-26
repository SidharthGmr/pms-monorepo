"use client";

import React, { useRef, useState, DragEvent } from "react";
import { FileText, ImageIcon, Loader2, Trash2, UploadCloud, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBlobUpload } from "@/hooks/service-hooks/useMediaService";
import { BLOB_MAX_SIZE_MB, UPLOAD_KIND_ACCEPT, UPLOAD_KIND_LABEL, UploadKind } from "@/lib/blob-upload";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  /** The uploaded file's URL (an /api/blob/view/... path). Empty string means no file. */
  value: string;
  onChange: (value: string) => void;
  /** What may be uploaded: image (default), doc, or any. Drives the picker filter,
   *  the client validation and the server-side check. */
  kind?: UploadKind;
  /** Sub-folder inside the signed-in user's own blob prefix, e.g. "invoices". */
  folder?: string;
  /** Client-side size ceiling. Defaults to the server's own limit. */
  maxSizeMb?: number;
  /** Headline inside the drop zone. */
  label?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Generic single-file uploader backed by the private Vercel Blob store. Drop it anywhere a
 * form needs one file: pass `kind` to control what it accepts, read the URL from `onChange`
 * and store that string - the same contract every other uploader in the app follows.
 */
export function FileUploader({ value, onChange, kind = "image", folder, maxSizeMb = BLOB_MAX_SIZE_MB, label, className, disabled }: FileUploaderProps) {
  const { uploadUrl, isUploading, progress } = useBlobUpload({ kind, folder, maxSizeMb });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const percent = Object.values(progress)[0] ?? 0;
  const isImage = kind === "image" || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(value);
  const fileName = value ? decodeURIComponent(value.split("/").pop() || "").replace(/^\d{10,}-/, "") : "";

  const handleUpload = async (file: File) => {
    if (disabled) return;
    const url = await uploadUrl(file);
    if (url) onChange(url);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]);
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files?.[0]) handleUpload(e.target.files[0]);
          e.target.value = "";
        }}
        accept={UPLOAD_KIND_ACCEPT[kind]}
        className="hidden"
        disabled={disabled}
      />

      {!value ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-6 text-center transition-colors",
            !disabled && "cursor-pointer hover:border-primary/50 hover:bg-muted/50",
            isDragging && "border-primary bg-primary/5",
            disabled && "opacity-50"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading... {percent}%</p>
            </>
          ) : (
            <>
              {kind === "image" ? <ImageIcon className="h-8 w-8 text-muted-foreground/60" /> : <UploadCloud className="h-8 w-8 text-muted-foreground/60" />}
              <p className="text-sm font-medium">{label || "Click to upload or drag & drop"}</p>
              <p className="text-xs text-muted-foreground">
                {UPLOAD_KIND_LABEL[kind]} up to {maxSizeMb}MB
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
          {isImage ? (
            <img src={value} alt={fileName || "Uploaded file"} className="h-14 w-14 rounded-md border object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-md border bg-background">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{fileName || "Uploaded file"}</p>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View file <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={disabled || isUploading}>
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Replace"}
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => onChange("")} disabled={disabled || isUploading} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUploader;
