'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Upload, File, Video, Copy, Check, Trash2, ExternalLink, RefreshCw, FolderOpen, User, Search } from 'lucide-react';
import CameraCaptureButton from '@/components/common/admin-media/camera-capture';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useDeleteMedia, useGetAllMedia, useBlobUpload } from '@/hooks/service-hooks/useMediaService';
import { PageHeader } from '../page-header';
import { BlobFileDto } from '@pms/types';

// The list endpoint carries no MIME metadata, so file kinds come from the extension.
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|avi|mkv)$/i;

const fileExtension = (pathname: string) => pathname.split('.').pop()?.toLowerCase() || '';

export default function AdminMediaDashboard() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [files, setFiles] = useState<BlobFileDto[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Drag & Drop State
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState('all');

  const mediaQuery = useGetAllMedia(!!session);
  const deleteMedia = useDeleteMedia({ silent: true });
  const { upload } = useBlobUpload({ kind: 'any', silent: true });

  useEffect(() => {
    if (mediaQuery.data?.images) setFiles(mediaQuery.data.images);
  }, [mediaQuery.data]);

  useEffect(() => {
    if (mediaQuery.isError) toast.error((mediaQuery.error as Error)?.message || 'Error loading media items');
  }, [mediaQuery.isError, mediaQuery.error]);

  const isLoading = mediaQuery.isPending || mediaQuery.isFetching;

  const fetchMedia = useCallback(() => {
    void mediaQuery.refetch();
  }, [mediaQuery]);

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
    setUploadingFiles((prev) => [...prev, ...filesToUpload]);

    for (const file of filesToUpload) {
      setUploadProgress((prev) => ({ ...prev, [file.name]: 10 }));

      try {
        const uploaded = await upload(file, {
          onProgress: (percent) => setUploadProgress((prev) => ({ ...prev, [file.name]: percent })),
        });

        if (uploaded) {
          toast.success(`Uploaded ${file.name} successfully!`);
          setFiles((prev) => [uploaded, ...prev]);
        } else {
          toast.error(`Failed to upload ${file.name}`);
        }
      } catch (err) {
        console.error(err);
        toast.error(`Error uploading ${file.name}`);
      } finally {
        setUploadProgress((prev) => {
          const updated = { ...prev };
          delete updated[file.name];
          return updated;
        });
        setUploadingFiles((prev) => prev.filter((f) => f.name !== file.name));
      }
    }
  };

  const handleDelete = async (pathname: string) => {
    if (!confirm('Are you sure you want to delete this file permanently?')) return;

    try {
      await deleteMedia.mutateAsync(pathname);
      setFiles((prev) => prev.filter((f) => f.pathname !== pathname));
      toast.success('File deleted successfully');
    } catch (error) {
      toast.error((error as Error)?.message || 'Error deleting file');
    }
  };

  const copyToClipboard = async (url: string, id: string) => {
    try {
      // The stored URL is relative (same-origin serving route); copy something pasteable.
      await navigator.clipboard.writeText(url.startsWith('/') ? `${window.location.origin}${url}` : url);
      setCopiedId(id);
      toast.success('URL copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get dynamic folder suffix/owner
  const getFolderOwner = (pathname: string) => {
    const parts = pathname.split('/');
    if (parts.length > 1) {
      const folderName = parts[parts.length - 2];
      if (folderName.startsWith('user_')) {
        return folderName.replace('user_', 'User ID: ');
      }
      return folderName;
    }
    return 'Root';
  };

  // Extract all unique folders for super admin filtering
  const uniqueFolders = Array.from(new Set(files.map((f) => f.pathname.split('/').slice(0, -1).join('/')))).filter(Boolean);

  // Filtered files
  const filteredFiles = files.filter((file) => {
    const fileName = file.pathname.split('/').pop() || '';
    const matchesSearch =
      fileName.toLowerCase().includes(searchQuery.toLowerCase()) || file.pathname.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedFolderFilter === 'all') return matchesSearch;
    const fileFolder = file.pathname.split('/').slice(0, -1).join('/');
    return matchesSearch && fileFolder === selectedFolderFilter;
  });

  return (
    <div className="space-y-8">
      {/* Gallery Section */}
      <PageHeader title={`File Manager`} description="Manage media uploads and resources with secure dynamic folders." variant="back" />

      <Card className="border border-border/50 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/40 gap-4">
          {/* <div>
            <CardTitle className="text-xl">Media Gallery</CardTitle>
            <CardDescription>
              {isSuperAdmin 
                ? "Super Admin view: Displaying all uploaded files from all admin folders." 
                : "Admin view: Displaying files uploaded under your personal folder."}
            </CardDescription>
          </div> */}
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
                  {uniqueFolders.map((folder) => (
                    <option key={folder} value={folder}>
                      {folder.replace('uploads/', '')}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button type="button" className="h-9 gap-1.5" onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4" />
              Upload
            </Button>

            <Button variant="outline" size="icon" className="h-9 w-9" onClick={fetchMedia} aria-label="Refresh">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
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
              <p className="text-sm text-muted-foreground max-w-sm mt-1">Upload files to see them here, or adjust your search filter criteria.</p>
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
                  {filteredFiles.map((file) => {
                    const fileName = file.pathname.split('/').pop() || file.pathname;
                    const folderOwner = getFolderOwner(file.pathname);
                    const isImage = IMAGE_EXT.test(file.pathname);
                    const isVideo = VIDEO_EXT.test(file.pathname);

                    return (
                      <tr key={file.pathname} className="hover:bg-muted/20 transition-colors group">
                        {/* Thumbnail */}
                        <td className="p-4">
                          <div className="relative h-12 w-12 rounded border overflow-hidden bg-muted/40 flex items-center justify-center">
                            {isImage ? (
                              <img src={file.url} alt={fileName} className="h-full w-full object-cover" loading="lazy" />
                            ) : isVideo ? (
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
                            {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : '—'}
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
                          <div className="font-medium text-foreground uppercase text-xs">{fileExtension(file.pathname)}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{formatBytes(file.size ?? 0)}</div>
                        </td>

                        {/* URL Copy */}
                        <td className="p-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(file.url, file.pathname)}
                            className="h-8 px-2 text-xs font-normal gap-1.5 hover:bg-muted"
                          >
                            {copiedId === file.pathname ? (
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
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(file.pathname)}
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

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Upload files</DialogTitle>
            <DialogDescription>Images, videos and documents land in your own admin folder.</DialogDescription>
          </DialogHeader>

          <Card
            className={`border-2 border-dashed transition-all duration-300 ${
              isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border/60 bg-card hover:border-primary/45'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <CardContent
              className="p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px]"
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple className="hidden" />

              <div className="p-4 bg-muted/40 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                <Upload className="h-10 w-10 text-muted-foreground" />
              </div>

              <h3 className="text-lg font-semibold tracking-tight mb-1">Drag and Drop Files Here</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                Support images, videos, and raw documents. Folder creation is automated for your admin profile.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button variant="secondary" size="sm" type="button" onClick={() => fileInputRef.current?.click()}>
                  Browse Files
                </Button>
                <CameraCaptureButton
                  label="photo"
                  text="Take photo"
                  className="h-9"
                  busy={uploadingFiles.length > 0}
                  onCapture={async (file) => {
                    await uploadMultipleFiles([file]);
                  }}
                />
              </div>

              {/* Upload Progress List */}
              {uploadingFiles.length > 0 && (
                <div className="w-full max-w-md mt-6 space-y-2 border-t pt-4 text-left" onClick={(e) => e.stopPropagation()}>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Uploading Files</h4>
                  {uploadingFiles.map((file) => (
                    <div key={file.name} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded border">
                      <div className="flex items-center gap-2 min-w-0">
                        <File className="h-3.5 w-3.5 text-primary animate-pulse" />
                        <span className="truncate font-medium max-w-[200px]">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{uploadProgress[file.name] || 0}%</span>
                        <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploadProgress[file.name] || 0}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
}
