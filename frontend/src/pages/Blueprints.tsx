import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import {
  CloudArrowUpIcon,
  Squares2X2Icon,
  ListBulletIcon,
  EyeIcon,
  TrashIcon,
  ArrowPathIcon,
  DocumentTextIcon as DocumentIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { DocumentTextIcon } from '@heroicons/react/24/solid';
import { useBlueprints, useUploadBlueprint, useDeleteBlueprint, useGenerateBid } from '../hooks/useApi';
import { blueprintsApi } from '../lib/api';
import type { Blueprint, BlueprintStatus } from '../types/api';

// Status badge mapping
const statusBadges: Record<BlueprintStatus, { variant: 'blue' | 'yellow' | 'green' | 'red'; label: string }> = {
  pending: { variant: 'blue', label: 'Pending' },
  processing: { variant: 'yellow', label: 'Processing' },
  'processed-dxf': { variant: 'green', label: 'DXF Processed' },
  completed: { variant: 'green', label: 'Completed' },
  failed: { variant: 'red', label: 'Failed' },
};

// File upload state
interface FileUpload {
  id: string;
  file: File;
  projectName: string;
  projectAddress: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  blueprintId?: string;
}

// Upload Modal Component
function UploadModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [projectName, setProjectName] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const uploadMutation = useUploadBlueprint();
  const toast = useToast();

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const ext = file.name.toLowerCase();
      return ext.endsWith('.pdf') || ext.endsWith('.png') ||
             ext.endsWith('.jpg') || ext.endsWith('.jpeg') ||
             ext.endsWith('.dxf');
    });

    if (validFiles.length !== fileArray.length) {
      toast.error('Invalid files', 'Some files were filtered out. Only PDF, PNG, JPG, and DXF are supported.');
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (fileUpload: FileUpload): Promise<void> => {
    setUploads(prev => prev.map(u =>
      u.id === fileUpload.id ? { ...u, status: 'uploading', progress: 0 } : u
    ));

    try {
      // Simulate progress (in real implementation, you'd use XMLHttpRequest or axios for progress)
      const progressInterval = setInterval(() => {
        setUploads(prev => prev.map(u =>
          u.id === fileUpload.id && u.progress < 90
            ? { ...u, progress: u.progress + 10 }
            : u
        ));
      }, 200);

      const result = await uploadMutation.mutateAsync({
        file: fileUpload.file,
        projectName: fileUpload.projectName || undefined,
        projectAddress: fileUpload.projectAddress || undefined,
      });

      clearInterval(progressInterval);

      setUploads(prev => prev.map(u =>
        u.id === fileUpload.id
          ? { ...u, status: 'success', progress: 100, blueprintId: result.blueprint.id }
          : u
      ));

      toast.success('Upload complete', `${fileUpload.file.name} uploaded successfully`);
    } catch (err) {
      setUploads(prev => prev.map(u =>
        u.id === fileUpload.id
          ? { ...u, status: 'error', error: err instanceof Error ? err.message : 'Upload failed' }
          : u
      ));
      toast.error('Upload failed', `${fileUpload.file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error('No files selected', 'Please select at least one blueprint file');
      return;
    }

    setIsUploading(true);

    // Create upload queue
    const uploadQueue: FileUpload[] = selectedFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      projectName: selectedFiles.length === 1 ? projectName.trim() : '',
      projectAddress: selectedFiles.length === 1 ? projectAddress.trim() : '',
      progress: 0,
      status: 'pending',
    }));

    setUploads(uploadQueue);

    // Upload files sequentially
    for (const fileUpload of uploadQueue) {
      await uploadFile(fileUpload);
    }

    setIsUploading(false);

    // Show success summary
    const successCount = uploadQueue.filter(u => {
      const upload = uploads.find(up => up.id === u.id);
      return upload?.status === 'success';
    }).length;

    if (successCount > 0) {
      onSuccess();
    }

    // Auto-close if all successful
    if (successCount === uploadQueue.length) {
      setTimeout(() => {
        onClose();
        setSelectedFiles([]);
        setUploads([]);
        setProjectName('');
        setProjectAddress('');
      }, 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Blueprints" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {selectedFiles.length <= 1 && uploads.length === 0 && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Project Name</label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Westlake Apartments Building C"
                disabled={isUploading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Project Address</label>
              <Input
                value={projectAddress}
                onChange={(e) => setProjectAddress(e.target.value)}
                placeholder="123 Main St, City, State"
                disabled={isUploading}
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Blueprint Files * {selectedFiles.length > 1 && `(${selectedFiles.length} selected)`}
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              selectedFiles.length > 0 ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500'
            }`}
            onClick={() => !isUploading && document.getElementById('file-input')?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('border-blue-400');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('border-blue-400');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-blue-400');
              if (!isUploading) {
                handleFileSelect(e.dataTransfer.files);
              }
            }}
          >
            <CloudArrowUpIcon className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400">
              {isUploading ? 'Uploading...' : 'Click or drag files here'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PDF, PNG, JPG, DXF (max 50MB each) • Multiple files supported
            </p>
          </div>
          <input
            id="file-input"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.dxf"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={isUploading}
          />
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && uploads.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-300">Selected Files:</p>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-slate-800 rounded">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <DocumentIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{file.name}</p>
                      <p className="text-xs text-slate-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploads.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-300">Upload Progress:</p>
            <div className="max-h-64 overflow-y-auto space-y-3">
              {uploads.map((upload) => (
                <div key={upload.id} className="p-3 bg-slate-800 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {upload.status === 'success' ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : upload.status === 'error' ? (
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                      ) : (
                        <ArrowPathIcon className={`w-5 h-5 text-blue-400 flex-shrink-0 ${upload.status === 'uploading' ? 'animate-spin' : ''}`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 truncate">{upload.file.name}</p>
                        {upload.error && (
                          <p className="text-xs text-red-400 mt-1">{upload.error}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 ml-2">
                      {upload.status === 'success' ? '100%' :
                       upload.status === 'error' ? 'Failed' :
                       upload.status === 'uploading' ? `${upload.progress}%` : 'Pending'}
                    </span>
                  </div>
                  {upload.status === 'uploading' && (
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (!isUploading) {
                onClose();
                setSelectedFiles([]);
                setUploads([]);
                setProjectName('');
                setProjectAddress('');
              }
            }}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Cancel'}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={selectedFiles.length === 0 || isUploading}
          >
            {isUploading
              ? `Uploading ${uploads.filter(u => u.status === 'uploading' || u.status === 'pending').length}...`
              : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`
            }
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Blueprint Card Component
function BlueprintCard({
  blueprint,
  onView,
  onDelete,
  onGenerateBid,
}: {
  blueprint: Blueprint;
  onView: () => void;
  onDelete: () => void;
  onGenerateBid: () => void;
}) {
  const statusInfo = statusBadges[blueprint.status] || { variant: 'blue', label: blueprint.status };

  return (
    <Card hover className="overflow-hidden">
      <div className="relative">
        <div className="aspect-video bg-slate-800 flex items-center justify-center">
          {blueprint.file_path ? (
            <img
              src={blueprintsApi.fileUrl(blueprint.file_path)}
              alt={blueprint.project_name || blueprint.file_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <DocumentTextIcon className="w-12 h-12 text-slate-600" />
          )}
        </div>
        <div className="absolute top-2 right-2">
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-100 truncate">
          {blueprint.project_name || blueprint.file_name}
        </h3>
        {blueprint.project_address && (
          <p className="text-xs text-slate-400 mt-1 truncate">{blueprint.project_address}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-500">
            {new Date(blueprint.created_at).toLocaleDateString()}
          </span>
          {blueprint.total_fixtures > 0 && (
            <span className="text-xs text-blue-400">{blueprint.total_fixtures} fixtures</span>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onView}>
            <EyeIcon className="w-4 h-4 mr-1" />
            View
          </Button>
          {blueprint.status === 'completed' && (
            <Button variant="primary" size="sm" onClick={onGenerateBid}>
              <CurrencyDollarIcon className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function Blueprints() {
  const navigate = useNavigate();
  const toast = useToast();

  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // API Hooks
  const { data, isLoading, error, refetch } = useBlueprints();
  const deleteMutation = useDeleteBlueprint();
  const generateBidMutation = useGenerateBid();
  const uploadMutation = useUploadBlueprint();

  // Filter blueprints
  const filteredBlueprints = (data?.blueprints || []).filter((bp) => {
    const matchesStatus = statusFilter === 'all' || bp.status === statusFilter;
    const matchesSearch =
      (bp.project_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      bp.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Handlers
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blueprint?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Blueprint deleted');
    } catch (err) {
      toast.error('Failed to delete', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleGenerateBid = async (blueprintId: string) => {
    try {
      const result = await generateBidMutation.mutateAsync({ blueprintId });
      toast.success('Bid generated', `Bid #${result.bid.bid_number}`);
      navigate(`/estimates`); // Navigate to estimates page
    } catch (err) {
      toast.error('Failed to generate bid', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(f =>
      f.type === 'application/pdf' ||
      f.type === 'image/png' ||
      f.type === 'image/jpeg' ||
      f.name.endsWith('.dxf')
    );

    if (!validFile) {
      toast.error('Invalid file type', 'Please upload PDF, PNG, JPG, or DXF files');
      return;
    }

    try {
      const result = await uploadMutation.mutateAsync({ file: validFile });
      toast.success('Upload successful', `${result.blueprint.totalFixtures} fixtures detected`);
      refetch();
    } catch (err) {
      toast.error('Upload failed', err instanceof Error ? err.message : 'Unknown error');
    }
  }, [uploadMutation, toast, refetch]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Blueprints</h1>
          <p className="text-slate-400 mt-1">Upload and analyze construction blueprints</p>
        </div>
        <Button variant="primary" onClick={() => setIsUploadOpen(true)}>
          <CloudArrowUpIcon className="w-5 h-5 mr-2" />
          Upload Blueprint
        </Button>
      </div>

      {/* Upload Zone */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center py-8">
          <CloudArrowUpIcon className={`w-12 h-12 mx-auto mb-3 ${isDragging ? 'text-blue-400' : 'text-slate-600'}`} />
          <h3 className="text-lg font-semibold text-slate-300 mb-1">
            {isDragging ? 'Drop file here' : 'Drop blueprints here'}
          </h3>
          <p className="text-sm text-slate-500">or click "Upload Blueprint" above</p>
          <p className="text-xs text-slate-600 mt-2">Supports: PDF, PNG, JPG, DXF (max 50MB)</p>
        </div>
      </Card>

      {/* Filter Bar */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search blueprints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </Select>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Squares2X2Icon className="w-5 h-5" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <ListBulletIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-500/50 bg-red-500/10">
          <p className="text-red-400">{error.message}</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()} className="mt-2">
            Retry
          </Button>
        </Card>
      )}

      {/* Blueprints Grid/List */}
      {!isLoading && !error && filteredBlueprints.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="w-16 h-16" />}
          title="No blueprints yet"
          description="Upload your first blueprint to get started with AI-powered analysis"
          action={
            <Button variant="primary" onClick={() => setIsUploadOpen(true)}>
              <CloudArrowUpIcon className="w-5 h-5 mr-2" />
              Upload Blueprint
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlueprints.map((blueprint) => (
            <BlueprintCard
              key={blueprint.id}
              blueprint={blueprint}
              onView={() => navigate(`/blueprints/${blueprint.id}`)}
              onDelete={() => handleDelete(blueprint.id)}
              onGenerateBid={() => handleGenerateBid(blueprint.id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">File</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Fixtures</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredBlueprints.map((blueprint) => {
                  const statusInfo = statusBadges[blueprint.status] || { variant: 'blue', label: blueprint.status };
                  return (
                    <tr key={blueprint.id} className="hover:bg-slate-900/50">
                      <td className="px-4 py-3 text-sm text-slate-200">
                        {blueprint.project_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">{blueprint.file_name}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {blueprint.total_fixtures || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {new Date(blueprint.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/blueprints/${blueprint.id}`)}>
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                          {blueprint.status === 'completed' && (
                            <Button variant="ghost" size="sm" onClick={() => handleGenerateBid(blueprint.id)}>
                              <CurrencyDollarIcon className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(blueprint.id)}>
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination info */}
      {data?.pagination && data.pagination.total > 0 && (
        <div className="text-center text-sm text-slate-400">
          Showing {filteredBlueprints.length} of {data.pagination.total} blueprints
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
