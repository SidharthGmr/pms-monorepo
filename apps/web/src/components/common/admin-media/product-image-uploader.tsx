"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProductImageUploaderProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function ProductImageUploader({ value = [], onChange }: ProductImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList) => {
    setIsUploading(true);
    const uploadedUrls: string[] = [...value];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/admin-media/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.data?.secure_url) {
          uploadedUrls.push(data.data.secure_url);
        } else {
          toast.error(data.message || `Failed to upload ${file.name}`);
        }
      } catch (error) {
        console.error(error);
        toast.error(`Error uploading ${file.name}`);
      }
    }

    onChange(uploadedUrls);
    setIsUploading(false);
  };

  const removeImage = (index: number) => {
    const updated = [...value];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && handleUpload(e.target.files)}
        multiple
        accept="image/*"
        className="hidden"
      />
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer bg-muted/10 text-center"
      >
        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
        <span className="text-sm font-medium text-foreground">
          {isUploading ? "Uploading images..." : "Click or Drag to Upload Product Images"}
        </span>
        <span className="text-xs text-muted-foreground mt-1">
          Supports PNG, JPG, WEBP
        </span>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-3">
          {value.map((url, index) => (
            <div key={index} className="relative h-20 w-20 rounded border overflow-hidden bg-muted group">
              <img src={url} alt={`product-${index}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
