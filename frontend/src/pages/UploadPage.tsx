import { useNavigate, useParams } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useUploadPolling } from '../hooks/useApi';
import { pagesApi } from '../lib/api';
import type { Page } from '../types/api';

// Status badge mapping
const statusBadges: Record<string, { variant: 'blue' | 'yellow' | 'green' | 'red'; label: string }> = {
  UPLOADED: { variant: 'blue', label: 'Uploaded' },
  PROCESSING: { variant: 'yellow', label: 'Processing' },
  READY: { variant: 'green', label: 'Ready' },
  FAILED: { variant: 'red', label: 'Failed' },
};

export default function UploadPage() {
  const { uploadId } = useParams<{ uploadId: string }>();
  const navigate = useNavigate();
  const { data: upload, isLoading, error } = useUploadPolling(uploadId || '');

  if (!uploadId) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No upload ID provided</p>
        <Button variant="secondary" onClick={() => navigate('/blueprints')} className="mt-4">
          Back to Blueprints
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowPathIcon className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error || !upload) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error?.message || 'Upload not found'}</p>
        <Button variant="secondary" onClick={() => navigate('/blueprints')}>
          Back to Blueprints
        </Button>
      </div>
    );
  }

  const statusInfo = statusBadges[upload.status] || { variant: 'blue', label: upload.status };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/blueprints')}>
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-100">{upload.originalFilename}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {(upload.sizeBytes / 1024 / 1024).toFixed(2)} MB • {upload.mimeType}
          </p>
        </div>
        <Badge variant={statusInfo.variant} size="lg">{statusInfo.label}</Badge>
      </div>

      {/* Progress */}
      {upload.progress && upload.status === 'PROCESSING' && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-1">
                {upload.progress.steps.map((step, i) => {
                  const currentIdx = upload.progress!.steps.indexOf(upload.progress!.current);
                  const isCurrent = i === currentIdx;
                  const isPast = i < currentIdx;
                  return (
                    <div
                      key={step}
                      className={`h-2 flex-1 rounded-full transition-colors ${
                        isCurrent ? 'bg-blue-500 animate-pulse' : isPast ? 'bg-green-500' : 'bg-slate-700'
                      }`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span className="capitalize">{upload.progress.current.replace(/_/g, ' ')}</span>
                <span>{upload.progress.steps.indexOf(upload.progress.current) + 1} / {upload.progress.steps.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {upload.errorMessage && (
        <Card className="border-red-500/50 bg-red-500/10">
          <p className="text-red-400">{upload.errorMessage}</p>
        </Card>
      )}

      {/* Warnings */}
      {upload.warnings && Object.keys(upload.warnings).length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardHeader>
            <CardTitle className="text-yellow-400">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-yellow-300 list-disc list-inside">
              {Object.entries(upload.warnings).map(([key, value]) => (
                <li key={key}>{key}: {String(value)}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Pages Grid */}
      {upload.status === 'READY' && upload.pages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pages ({upload.pages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {upload.pages.map((page: Page) => (
                <button
                  key={page.id}
                  onClick={() => {
                    localStorage.setItem('currentUploadId', upload.id);
                    navigate(`/pages/${page.id}`);
                  }}
                  className="group relative aspect-square bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-blue-500 transition-colors"
                >
                  <img
                    src={pagesApi.thumbUrl(page.id)}
                    alt={`Page ${page.pageNumber}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-xs text-white font-medium">Page {page.pageNumber}</p>
                  </div>
                  <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State for Processing */}
      {upload.status === 'PROCESSING' && (
        <div className="text-center py-12">
          <ArrowPathIcon className="w-12 h-12 text-slate-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Processing your blueprint...</p>
          <p className="text-sm text-slate-500 mt-2">This may take a few moments</p>
        </div>
      )}
    </div>
  );
}
