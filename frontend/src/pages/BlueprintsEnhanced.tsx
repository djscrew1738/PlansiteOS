import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import FileUpload, { type FileWithPreview } from '../components/ui/FileUpload';
import Combobox, { type ComboboxOption } from '../components/ui/Combobox';
import Tooltip from '../components/ui/Tooltip';
import DatePicker from '../components/ui/DatePicker';
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
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { DocumentTextIcon } from '@heroicons/react/24/solid';
import { BlueprintsSkeleton } from './BlueprintsSkeleton';
import ErrorState from '../components/ui/ErrorState';
import { useBlueprints, useUploadBlueprint, useDeleteBlueprint, useGenerateBid } from '../hooks/useApi';
import type { Blueprint, BlueprintStatus } from '../types/api';

// Status badge mapping
const statusBadges: Record<BlueprintStatus, { variant: 'blue' | 'yellow' | 'green' | 'red'; label: string }> = {
  pending: { variant: 'blue', label: 'Pending' },
  processing: { variant: 'yellow', label: 'Processing' },
  'processed-dxf': { variant: 'green', label: 'DXF Processed' },
  completed: { variant: 'green', label: 'Completed' },
  failed: { variant: 'red', label: 'Failed' },
};

// Status options for filter
const statusOptions: ComboboxOption[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending', description: 'Waiting to process' },
  { value: 'processing', label: 'Processing', description: 'Currently processing' },
  { value: 'processed-dxf', label: 'DXF Processed', description: 'DXF extraction complete' },
  { value: 'completed', label: 'Completed', description: 'Fully processed' },
  { value: 'failed', label: 'Failed', description: 'Processing failed' },
];

// Format bytes to human-readable
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

// Upload Modal Component with progress-aware large file upload
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
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [errors, setErrors] = useState<{ projectName?: string; projectAddress?: string }>({});
  const [uploadProgress, setUploadProgress] = useState<{
    active: boolean;
    fileName: string;
    percent: number;
    loaded: number;
    total: number;
    fileIndex: number;
    fileCount: number;
  } | null>(null);
  const uploadMutation = useUploadBlueprint();
  const toast = useToast();

  const validateField = (name: string, value: string) => {
    if (!value.trim()) {
      return `${name} is required.`;
    }
    return undefined;
  };

  const handleUpload = async (filesToUpload: File[]) => {
    const projectNameError = validateField('Project Name', projectName);
    const projectAddressError = validateField('Project Address', projectAddress);

    if (projectNameError || projectAddressError) {
      setErrors({
        projectName: projectNameError,
        projectAddress: projectAddressError,
      });
      toast.error('Validation Error', 'Please fill in all required fields');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    // Upload each file sequentially with progress tracking
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];

      setUploadProgress({
        active: true,
        fileName: file.name,
        percent: 0,
        loaded: 0,
        total: file.size,
        fileIndex: i + 1,
        fileCount: filesToUpload.length,
      });

      try {
        await uploadMutation.mutateAsync({
          file,
          projectName: projectName || undefined,
          projectAddress: projectAddress || undefined,
          onProgress: (e) => {
            setUploadProgress((prev) =>
              prev
                ? { ...prev, percent: e.percent, loaded: e.loaded, total: e.total }
                : null
            );
          },
        });
        successCount++;
        toast.success('Upload complete', `${file.name} uploaded successfully`);
      } catch (err) {
        failCount++;
        toast.error(
          'Upload failed',
          `${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }

    setUploadProgress(null);

    // Success - reset and close
    if (successCount > 0) {
      toast.success(
        'Uploads finished',
        `${successCount} of ${filesToUpload.length} file(s) uploaded${failCount ? `, ${failCount} failed` : ''}`
      );
      setTimeout(() => {
        onSuccess();
        onClose();
        setProjectName('');
        setProjectAddress('');
        setFiles([]);
        setErrors({});
      }, 1000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Blueprints" size="lg">
      <div className="space-y-4">
        {/* Project Info */}
        <Input
          name="projectName"
          label="Project Name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          onBlur={(e) => {
            const error = validateField('Project Name', e.target.value);
            setErrors((prev) => ({ ...prev, projectName: error }));
          }}
          placeholder="e.g., Westlake Apartments Building C"
          error={errors.projectName}
        />

        <Input
          name="projectAddress"
          label="Project Address"
          value={projectAddress}
          onChange={(e) => setProjectAddress(e.target.value)}
          onBlur={(e) => {
            const error = validateField('Project Address', e.target.value);
            setErrors((prev) => ({ ...prev, projectAddress: error }));
          }}
          placeholder="123 Main St, City, State"
          error={errors.projectAddress}
        />

        {/* Upload Progress Indicator */}
        {uploadProgress?.active && (
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-300 font-medium truncate max-w-[70%]">
                Uploading: {uploadProgress.fileName}
              </span>
              <span className="text-blue-400 text-xs">
                {uploadProgress.fileIndex}/{uploadProgress.fileCount}
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress.percent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>
                {formatBytes(uploadProgress.loaded)} / {formatBytes(uploadProgress.total)}
              </span>
              <span>{uploadProgress.percent}%</span>
            </div>
          </div>
        )}

        {/* File Upload Component – 200MB max per file */}
        <FileUpload
          accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif,.dxf"
          multiple={true}
          maxSize={200 * 1024 * 1024}
          maxFiles={10}
          onFilesChange={setFiles}
          onUpload={handleUpload}
          disabled={!!uploadProgress?.active}
          showPreview={true}
        />

        {/* Large file guidance */}
        <p className="text-xs text-slate-500">
          Supports PDF blueprints up to 200 MB and 200 pages. Large files are uploaded
          in the background with progress tracking.
        </p>
      </div>
    </Modal>
  );
}

export default function BlueprintsEnhanced() {
  const navigate = useNavigate();
  const toast = useToast();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<Date>();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [generatingBidId, setGeneratingBidId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useBlueprints();
  const deleteMutation = useDeleteBlueprint();
  const generateBidMutation = useGenerateBid();

  const filteredBlueprints = (data?.blueprints || []).filter((bp) => {
    const matchesSearch = !searchQuery ||
      bp.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bp.project_address?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || bp.status === statusFilter;

    const matchesDate = !dateFilter ||
      new Date(bp.created_at).toDateString() === dateFilter.toDateString();

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blueprint?')) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Deleted', 'Blueprint deleted successfully');
      refetch();
    } catch (err) {
      toast.error('Error', 'Failed to delete blueprint');
    }
  };

  const handleGenerateBid = async (id: string) => {
    setGeneratingBidId(id);
    try {
      const result = await generateBidMutation.mutateAsync(id);
      toast.success('Bid Generated', 'Navigate to estimates to view the bid');
      setTimeout(() => navigate(`/estimates`), 1500);
    } catch (err) {
      toast.error('Error', 'Failed to generate bid');
    } finally {
      setGeneratingBidId(null);
    }
  };

  if (isLoading) return <BlueprintsSkeleton />;

  if (error) {
    return (
      <ErrorState
        title="Failed to load blueprints"
        message={error.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Blueprints</h1>
          <p className="mt-2 text-slate-400">
            Upload and manage blueprint files for AI-powered analysis
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsUploadOpen(true)}>
          <CloudArrowUpIcon className="w-5 h-5 mr-2" />
          Upload Blueprint
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Search blueprints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[240px]"
            />

            <Combobox
              options={statusOptions}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as string)}
              placeholder="Filter by status"
              className="min-w-[200px]"
            />

            <DatePicker
              value={dateFilter}
              onChange={setDateFilter}
              placeholder="Filter by date"
              className="min-w-[200px]"
            />

            <Tooltip content="Switch between grid and list view">
              <div className="flex gap-1 border border-slate-800 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Squares2X2Icon className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <ListBulletIcon className="w-4 h-4" />
                </Button>
              </div>
            </Tooltip>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {filteredBlueprints.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="w-16 h-16" />}
          title="No blueprints found"
          description={searchQuery || statusFilter !== 'all' || dateFilter
            ? "Try adjusting your filters"
            : "Upload your first blueprint to get started with AI-powered analysis"
          }
          action={
            !searchQuery && statusFilter === 'all' && !dateFilter ? (
              <Button variant="primary" onClick={() => setIsUploadOpen(true)}>
                <CloudArrowUpIcon className="w-5 h-5 mr-2" />
                Upload Blueprint
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className={viewMode === 'grid'
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          : "space-y-4"
        }>
          {filteredBlueprints.map((blueprint) => {
            const statusInfo = statusBadges[blueprint.status] || { variant: 'blue', label: blueprint.status };
            const isGeneratingBid = generatingBidId === blueprint.id;

            return (
              <Card key={blueprint.id} hover className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-100 truncate">
                        {blueprint.project_name || 'Untitled'}
                      </h3>
                      <p className="text-sm text-slate-400 truncate">
                        {blueprint.project_address || 'No address'}
                      </p>
                    </div>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                    <span>{new Date(blueprint.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2">
                    <Tooltip content="View blueprint details">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/blueprints/${blueprint.id}`)}
                        className="flex-1"
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Tooltip>

                    <Tooltip content="Generate estimate from blueprint">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleGenerateBid(blueprint.id)}
                        disabled={isGeneratingBid}
                        className="flex-1"
                      >
                        {isGeneratingBid ? (
                          <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                        )}
                        {isGeneratingBid ? 'Generating...' : 'Generate Bid'}
                      </Button>
                    </Tooltip>

                    <Tooltip content="Delete blueprint">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(blueprint.id)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
