import { useState, useRef, useCallback } from 'react';
import { CloudArrowUpIcon, XMarkIcon, DocumentIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export interface FileWithPreview {
  file: File;
  id: string;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  onFilesChange?: (files: FileWithPreview[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  disabled?: boolean;
  showPreview?: boolean;
}

export default function FileUpload({
  accept = '*',
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 10,
  onFilesChange,
  onUpload,
  disabled = false,
  showPreview = true,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size exceeds ${formatFileSize(maxSize)}`;
    }
    return null;
  };

  const createFilePreview = (file: File): string | undefined => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return undefined;
  };

  const addFiles = useCallback((newFiles: File[]) => {
    const validFiles: FileWithPreview[] = [];

    for (const file of newFiles) {
      if (!multiple && files.length + validFiles.length >= 1) break;
      if (files.length + validFiles.length >= maxFiles) break;

      const error = validateFile(file);
      validFiles.push({
        file,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        preview: createFilePreview(file),
        progress: 0,
        status: error ? 'error' : 'pending',
        error,
      });
    }

    const updatedFiles = multiple ? [...files, ...validFiles] : validFiles;
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
  }, [files, multiple, maxFiles, maxSize, onFilesChange]);

  const removeFile = (id: string) => {
    const fileToRemove = files.find(f => f.id === id);
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    const updatedFiles = files.filter(f => f.id !== id);
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const handleUpload = async () => {
    if (!onUpload) return;

    const filesToUpload = files.filter(f => f.status === 'pending').map(f => f.file);
    if (filesToUpload.length === 0) return;

    try {
      await onUpload(filesToUpload);
      // Mark files as success (in real implementation, track individual file progress)
      setFiles(prev => prev.map(f =>
        f.status === 'pending' ? { ...f, status: 'success', progress: 100 } : f
      ));
    } catch (error) {
      setFiles(prev => prev.map(f =>
        f.status === 'pending'
          ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
          : f
      ));
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return PhotoIcon;
    }
    return DocumentIcon;
  };

  return (
    <div className="w-full space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />

        <CloudArrowUpIcon className="w-12 h-12 mx-auto mb-4 text-slate-400" />
        <p className="text-lg font-medium text-slate-200 mb-1">
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-slate-400 mb-2">or click to browse</p>
        <p className="text-xs text-slate-500">
          {multiple ? `Up to ${maxFiles} files` : 'Single file'} • Max {formatFileSize(maxSize)} each
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-300">
              {files.length} {files.length === 1 ? 'file' : 'files'} selected
            </p>
            {onUpload && files.some(f => f.status === 'pending') && (
              <button
                onClick={handleUpload}
                disabled={disabled}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
              >
                Upload all
              </button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((fileItem) => {
              const Icon = getFileIcon(fileItem.file);

              return (
                <div
                  key={fileItem.id}
                  className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg border border-slate-800"
                >
                  {/* Preview or Icon */}
                  {showPreview && fileItem.preview ? (
                    <img
                      src={fileItem.preview}
                      alt={fileItem.file.name}
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-slate-400" />
                    </div>
                  )}

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {fileItem.file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-400">
                        {formatFileSize(fileItem.file.size)}
                      </p>
                      {fileItem.status === 'error' && fileItem.error && (
                        <p className="text-xs text-red-400">{fileItem.error}</p>
                      )}
                      {fileItem.status === 'success' && (
                        <p className="text-xs text-green-400 flex items-center gap-1">
                          <CheckCircleIcon className="w-3 h-3" />
                          Uploaded
                        </p>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {fileItem.status === 'uploading' && (
                      <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${fileItem.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(fileItem.id)}
                    disabled={disabled || fileItem.status === 'uploading'}
                    className="p-1 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
                  >
                    <XMarkIcon className="w-5 h-5 text-slate-400 hover:text-slate-200" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
