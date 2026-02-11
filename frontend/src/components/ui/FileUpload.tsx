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
  maxSize?: number;
  maxFiles?: number;
  onFilesChange?: (files: FileWithPreview[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  disabled?: boolean;
  showPreview?: boolean;
}

export default function FileUpload({
  accept = '*',
  multiple = true,
  maxSize = 10 * 1024 * 1024,
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
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) return `Exceeds ${formatFileSize(maxSize)} limit`;
    return null;
  };

  const createFilePreview = (file: File): string | undefined => {
    if (file.type.startsWith('image/')) return URL.createObjectURL(file);
    return undefined;
  };

  const addFiles = useCallback(
    (newFiles: File[]) => {
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
    },
    [files, multiple, maxFiles, maxSize, onFilesChange],
  );

  const removeFile = (id: string) => {
    const f = files.find((f) => f.id === id);
    if (f?.preview) URL.revokeObjectURL(f.preview);
    const updatedFiles = files.filter((f) => f.id !== id);
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
    addFiles(Array.from(e.dataTransfer.files));
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (!onUpload) return;
    const pending = files.filter((f) => f.status === 'pending').map((f) => f.file);
    if (pending.length === 0) return;
    try {
      await onUpload(pending);
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'pending' ? { ...f, status: 'success', progress: 100 } : f,
        ),
      );
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'pending'
            ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
            : f,
        ),
      );
    }
  };

  const getFileIcon = (file: File) => (file.type.startsWith('image/') ? PhotoIcon : DocumentIcon);

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
          relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-blue-500/60 bg-blue-500/[0.06] shadow-[inset_0_0_30px_rgba(59,130,246,0.06)]'
            : 'border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
          }
          ${disabled ? 'opacity-40 pointer-events-none' : ''}
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

        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
          isDragging ? 'bg-blue-500/15' : 'bg-slate-800/60'
        }`}>
          <CloudArrowUpIcon className={`h-7 w-7 transition-colors ${
            isDragging ? 'text-blue-400' : 'text-slate-500'
          }`} />
        </div>
        <p className="text-sm font-semibold text-slate-200 mb-1">
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-xs text-slate-500 mb-2">or click to browse</p>
        <p className="text-[11px] text-slate-600">
          {multiple ? `Up to ${maxFiles} files` : 'Single file'} &middot; Max {formatFileSize(maxSize)} each
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-xs font-medium text-slate-400">
              {files.length} {files.length === 1 ? 'file' : 'files'} selected
            </p>
            {onUpload && files.some((f) => f.status === 'pending') && (
              <button
                onClick={handleUpload}
                disabled={disabled}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-40"
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
                  className="flex items-center gap-3 rounded-xl border border-slate-800/50 bg-slate-900/50 p-3 transition-colors hover:bg-slate-900/70"
                >
                  {/* Preview or Icon */}
                  {showPreview && fileItem.preview ? (
                    <img
                      src={fileItem.preview}
                      alt={fileItem.file.name}
                      className="h-11 w-11 flex-shrink-0 rounded-lg object-cover ring-1 ring-slate-800/60"
                    />
                  ) : (
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800/50">
                      <Icon className="h-5 w-5 text-slate-500" />
                    </div>
                  )}

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{fileItem.file.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[11px] text-slate-500">{formatFileSize(fileItem.file.size)}</p>
                      {fileItem.status === 'error' && fileItem.error && (
                        <p className="text-[11px] font-medium text-red-400">{fileItem.error}</p>
                      )}
                      {fileItem.status === 'success' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                          <CheckCircleIcon className="h-3 w-3" />
                          Uploaded
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {fileItem.status === 'uploading' && (
                      <div className="mt-2 h-1 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
                          style={{ width: `${fileItem.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFile(fileItem.id)}
                    disabled={disabled || fileItem.status === 'uploading'}
                    className="flex-shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300 disabled:opacity-30"
                  >
                    <XMarkIcon className="h-4 w-4" />
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
