"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { 
  Upload, 
  X, 
  File, 
  Image as ImageIcon, 
  Video, 
  AlertCircle, 
  Copy, 
  Check, 
  Trash2, 
  ExternalLink, 
  RefreshCw,
  FolderOpen,
  User,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CloudinaryResource {
  public_id: string;
  format: string;
  version: number;
  resource_type: string;
  type: string;
  created_at: string;
  bytes: number;
  width: number;
  height: number;
  folder: string;
  url: string;
  secure_url: string;
}

export default function AdminMediaDashboard() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [files, setFiles] = useState<CloudinaryResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderFilter, setSelectedFolderFilter] = useState("all");

  const fetchMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin-media/get-all");
      const data = await res.json();
      if (data.success) {
        setFiles(data.images || []);
      } else {
        toast.error(data.message || "Failed to load files");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading media items");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchMedia();
    }
  }, [session, fetchMedia]);

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      await uploadMultipleFiles(droppedFiles);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      await uploadMultipleFiles(selectedFiles);
    }
  };

  const uploadMultipleFiles = async (filesToUpload: File[]) => {
    setUploadingFiles(prev => [...prev, ...filesToUpload]);
    
    for (const file of filesToUpload) {
      const formData = new FormData();
      formData.append("file", file);
      
      setUploadProgress(prev => ({ ...prev, [file.name]: 10 }));
      
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 40 }));
        
        const res = await fetch("/api/admin-media/upload", {
          method: "POST",
          body: formData,
        });
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 80 }));
        const data = await res.json();
        
        if (data.success) {
          toast.success(`Uploaded ${file.name} successfully!`);
          setFiles(prev => [data.data, ...prev]);
        } else {
          toast.error(data.message || `Failed to upload ${file.name}`);
        }
      } catch (err) {
        console.error(err);
        toast.error(`Error uploading ${file.name}`);
      } finally {
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[file.name];
          return updated;
        });
        setUploadingFiles(prev => prev.filter(f => f.name !== file.name));
      }
    }
  };

  const handleDelete = async (publicId: string) => {
    if (!confirm("Are you sure you want to delete this file permanently?")) return;

    try {
      const res = await fetch("/api/admin-media/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicId }),
      });
      const data = await res.json();

      if (data.success) {
        setFiles(prev => prev.filter(f => f.public_id !== publicId));
        toast.success("File deleted successfully");
      } else {
        toast.error(data.message || "Failed to delete file");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error deleting file");
    }
  };

  const copyToClipboard = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success("URL copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get dynamic folder suffix/owner
  const getFolderOwner = (publicId: string) => {
    const parts = publicId.split("/");
    if (parts.length > 1) {
      const folderName = parts[parts.length - 2];
      if (folderName.startsWith("admin_")) {
        return folderName.replace("admin_", "Admin ID: ");
      }
      return folderName;
    }
    return "Root";
  };

  // Extract all unique folders for super admin filtering
  const uniqueFolders = Array.from(
    new Set(files.map(f => f.public_id.split("/").slice(0, -1).join("/")))
  ).filter(Boolean);

  // Filtered files
  const filteredFiles = files.filter(file => {
    const fileName = file.public_id.split("/").pop() || "";
    const matchesSearch = fileName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          file.public_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFolderFilter === "all") return matchesSearch;
    const fileFolder = file.public_id.split("/").slice(0, -1).join("/");
    return matchesSearch && fileFolder === selectedFolderFilter;
  });

  return (
    <div className="space-y-8">
      {/* Drag & Drop Upload Panel */}
      <Card 
        className={`border-2 border-dashed transition-all duration-300 ${
          isDragging 
            ? "border-primary bg-primary/5 scale-[1.01]" 
            : "border-border/60 bg-card hover:border-primary/45"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px]" onClick={() => fileInputRef.current?.click()}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            multiple 
            className="hidden" 
          />
          
          <div className="p-4 bg-muted/40 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
            <Upload className="h-10 w-10 text-muted-foreground" />
          </div>
          
          <h3 className="text-lg font-semibold tracking-tight mb-1">Drag and Drop Files Here</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Support images, videos, and raw documents. Folder creation is automated for your admin profile.
          </p>
          <Button variant="secondary" size="sm" type="button">
            Browse Files
          </Button>

          {/* Upload Progress List */}
          {uploadingFiles.length > 0 && (
            <div className="w-full max-w-md mt-6 space-y-2 border-t pt-4 text-left" onClick={(e) => e.stopPropagation()}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Uploading Files</h4>
              {uploadingFiles.map(file => (
                <div key={file.name} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded border">
                  <div className="flex items-center gap-2 min-w-0">
                    <File className="h-3.5 w-3.5 text-primary animate-pulse" />
                    <span className="truncate font-medium max-w-[200px]">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{uploadProgress[file.name] || 0}%</span>
                    <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-300" 
                        style={{ width: `${uploadProgress[file.name] || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gallery Section */}
      <Card className="border border-border/50 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/40 gap-4">
          <div>
            <CardTitle className="text-xl">Media Gallery</CardTitle>
            <CardDescription>
              {isSuperAdmin 
                ? "Super Admin view: Displaying all uploaded files from all admin folders." 
                : "Admin view: Displaying files uploaded under your personal folder."}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 h-9 w-full sm:w-[220px] rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            {/* Super Admin Folder Filter */}
            {isSuperAdmin && uniqueFolders.length > 0 && (
              <div className="flex items-center gap-1.5">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <select
                  value={selectedFolderFilter}
                  onChange={(e) => setSelectedFolderFilter(e.target.value)}
                  className="h-9 px-3 py-1 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">All Folders</option>
                  {uniqueFolders.map(folder => (
                    <option key={folder} value={folder}>
                      {folder.replace("pms_admin_uploads/", "")}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button variant="outline" size="icon" className="h-9 w-9" onClick={fetchMedia}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 min-h-[300px]">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
                <p className="text-sm text-muted-foreground">Fetching media files...</p>
              </div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
              <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="font-semibold text-lg">No Files Found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                Upload files to see them here, or adjust your search filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 font-medium text-muted-foreground">
                    <th className="p-4 w-[80px]">Thumbnail</th>
                    <th className="p-4 min-w-[200px]">File Name</th>
                    <th className="p-4">Owner/Folder</th>
                    <th className="p-4">Size & Format</th>
                    <th className="p-4">URL</th>
                    <th className="p-4 text-right w-[150px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredFiles.map(file => {
                    const fileName = file.public_id.split("/").pop() || file.public_id;
                    const folderOwner = getFolderOwner(file.public_id);
                    
                    return (
                      <tr key={file.public_id} className="hover:bg-muted/20 transition-colors group">
                        {/* Thumbnail */}
                        <td className="p-4">
                          <div className="relative h-12 w-12 rounded border overflow-hidden bg-muted/40 flex items-center justify-center">
                            {file.resource_type === "image" ? (
                              <img 
                                src={file.secure_url} 
                                alt={fileName} 
                                className="h-full w-full object-cover" 
                                loading="lazy"
                              />
                            ) : file.resource_type === "video" ? (
                              <Video className="h-6 w-6 text-indigo-500" />
                            ) : (
                              <File className="h-6 w-6 text-emerald-500" />
                            )}
                          </div>
                        </td>

                        {/* File Name & Date */}
                        <td className="p-4">
                          <div className="font-medium text-foreground truncate max-w-[250px]" title={fileName}>
                            {fileName}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {new Date(file.created_at).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Owner/Folder */}
                        <td className="p-4">
                          <Badge variant="outline" className="gap-1 px-2.5 py-0.5 bg-muted/30">
                            {isSuperAdmin ? <User className="h-3 w-3" /> : <FolderOpen className="h-3 w-3" />}
                            {folderOwner}
                          </Badge>
                        </td>

                        {/* File details */}
                        <td className="p-4">
                          <div className="font-medium text-foreground uppercase text-xs">
                            {file.format}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {formatBytes(file.bytes)}
                            {file.width && file.height && ` • ${file.width}x${file.height}`}
                          </div>
                        </td>

                        {/* URL Copy */}
                        <td className="p-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyToClipboard(file.secure_url, file.public_id)}
                            className="h-8 px-2 text-xs font-normal gap-1.5 hover:bg-muted"
                          >
                            {copiedId === file.public_id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </Button>
                        </td>

                        {/* Action buttons */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a 
                              href={file.secure_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(file.public_id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
