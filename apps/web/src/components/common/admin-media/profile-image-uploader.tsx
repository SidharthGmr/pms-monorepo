"use client";

import React, { useState, useRef, DragEvent } from "react";
import { Camera, Loader2, Trash2, Link as LinkIcon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfileImageUploaderProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ProfileImageUploader({ value, onChange, className }: ProfileImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin-media/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data?.secure_url) {
        onChange(data.data.secure_url);
        toast.success("Profile image uploaded successfully");
      } else {
        toast.error(data.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Profile image upload error:", error);
      toast.error("Error uploading image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    onChange("");
    toast.success("Profile image URL cleared");
  };

  return (
    <div className={cn("flex flex-col items-center gap-6 w-full max-w-md mx-auto", className)}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && e.target.files[0] && handleUpload(e.target.files[0])}
        accept="image/*"
        className="hidden"
      />

      <div className="relative group">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative h-32 w-32 rounded-full border-4 border-background shadow-xl overflow-hidden cursor-pointer bg-muted flex items-center justify-center transition-all duration-300 ring-2 ring-primary/10 group-hover:ring-primary/45 group-hover:scale-105",
            isDragging && "ring-primary scale-105 border-primary/50"
          )}
        >
          {value ? (
            <img src={value} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <User className="h-14 w-14 text-muted-foreground/60" />
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-1.5 text-white">
            <Camera className="h-6 w-6 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300" />
            <span className="text-[10px] font-semibold tracking-wide uppercase">Change Photo</span>
          </div>

          {/* Loading Indicator */}
          {isUploading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}
        </div>

        {value && !isUploading && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-md scale-90 hover:scale-100 transition-transform"
            title="Remove Photo"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Manual URL Input Option */}
      <div className="w-full space-y-2">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Or paste image URL directly:</span>
        </div>
        <Input
          type="url"
          placeholder="https://example.com/avatar.jpg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 text-xs focus-visible:ring-1"
        />
      </div>
    </div>
  );
}
