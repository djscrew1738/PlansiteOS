import { useNavigate, useParams } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  MapPinIcon,
  CalendarIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { useBlueprint, useBlueprintSummary, useDeleteBlueprint, useGenerateBid } from '../hooks/useApi';
import { blueprintsApi } from '../lib/api';
import type { BlueprintStatus } from '../types/api';

// Status badge mapping
const statusBadges: Record<BlueprintStatus, { variant: 'blue' | 'yellow' | 'green' | 'red'; label: string }> = {
  pending: { variant: 'blue', label: 'Pending' },
  processing: { variant: 'yellow', label: 'Processing' },
  'processed-dxf': { variant: 'green', label: 'DXF Processed' },
  completed: { variant: 'green', label: 'Completed' },
  failed: { variant: 'red', label: 'Failed' },
};

export default function BlueprintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  // API hooks
  const { data: blueprintData, isLoading, error, refetch } = useBlueprint(id || '');
  const { data: summaryData, isLoading: loadingSummary } = useBlueprintSummary(id || '');
  const deleteMutation = useDeleteBlueprint();
  const generateBidMutation = useGenerateBid();

  const blueprint = blueprintData?.blueprint;
  const summary = summaryData?.summary;

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this blueprint?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Blueprint deleted');
      navigate('/blueprints');
    } catch (err) {
      toast.error('Failed to delete', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleGenerateBid = async () => {
    if (!id) return;
    try {
      const result = await generateBidMutation.mutateAsync({ blueprintId: id });
      toast.success('Bid generated', `Bid #${result.bid.bid_number} created`);
      navigate('/estimates');
    } catch (err) {
      toast.error('Failed to generate bid', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <ArrowPathIcon className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error || !blueprint) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <Button variant="ghost" onClick={() => navigate('/blueprints')}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Blueprints
        </Button>
        <EmptyState
          icon={<DocumentTextIcon className="w-16 h-16" />}
          title="Blueprint not found"
          description={error?.message || 'The requested blueprint could not be found'}
          action={
            <Button variant="primary" onClick={() => navigate('/blueprints')}>
              View All Blueprints
            </Button>
          }
        />
      </div>
    );
  }

  const statusInfo = statusBadges[blueprint.status] || { variant: 'blue', label: blueprint.status };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/blueprints')}>
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100">
                {blueprint.project_name || blueprint.file_name}
              </h1>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            {blueprint.project_address && (
              <div className="flex items-center gap-1 text-sm text-slate-400 mt-1">
                <MapPinIcon className="w-4 h-4" />
                {blueprint.project_address}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {blueprint.status === 'completed' && (
            <Button
              variant="primary"
              onClick={handleGenerateBid}
              disabled={generateBidMutation.isPending}
            >
              <CurrencyDollarIcon className="w-5 h-5 mr-2" />
              {generateBidMutation.isPending ? 'Generating...' : 'Generate Estimate'}
            </Button>
          )}
          <Button variant="ghost" onClick={handleDelete} disabled={deleteMutation.isPending}>
            <TrashIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Blueprint Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Blueprint Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[4/3] bg-slate-800 rounded-lg overflow-hidden">
                {blueprint.file_path ? (
                  <img
                    src={blueprintsApi.fileUrl(blueprint.file_path)}
                    alt={blueprint.project_name || blueprint.file_name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <DocumentTextIcon className="w-24 h-24 text-slate-600" />
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" size="sm">
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details Sidebar */}
        <div className="space-y-6">
          {/* File Info */}
          <Card>
            <CardHeader>
              <CardTitle>File Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">File Name</span>
                  <span className="text-slate-200 truncate ml-2">{blueprint.file_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">File Size</span>
                  <span className="text-slate-200">
                    {(blueprint.file_size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">File Type</span>
                  <span className="text-slate-200 uppercase">{blueprint.file_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Uploaded</span>
                  <span className="text-slate-200">
                    {new Date(blueprint.created_at).toLocaleDateString()}
                  </span>
                </div>
                {blueprint.analysis_completed_at && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Analyzed</span>
                    <span className="text-slate-200">
                      {new Date(blueprint.analysis_completed_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Summary */}
          {blueprint.status === 'completed' && blueprint.analysis_data && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-slate-800 rounded-lg">
                    <p className="text-2xl font-bold text-blue-500">
                      {blueprint.analysis_data.summary.totalFixtures}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Total Fixtures</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800 rounded-lg">
                    <p className="text-2xl font-bold text-green-500">
                      {blueprint.analysis_data.summary.totalRooms}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Rooms</p>
                  </div>
                </div>
                {blueprint.analysis_data.summary.scale && (
                  <div className="mt-4 p-3 bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-400">Scale</p>
                    <p className="text-sm text-slate-200">{blueprint.analysis_data.summary.scale}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Error Message */}
          {blueprint.status === 'failed' && blueprint.error_message && (
            <Card className="border-red-500/50">
              <CardHeader>
                <CardTitle className="text-red-400">Analysis Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-300">{blueprint.error_message}</p>
                <Button variant="secondary" size="sm" className="mt-4" onClick={() => refetch()}>
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Retry Analysis
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Processing Status */}
          {(blueprint.status === 'pending' || blueprint.status === 'processing') && (
            <Card>
              <CardContent>
                <div className="flex items-center gap-3">
                  <ArrowPathIcon className="w-6 h-6 text-blue-400 animate-spin" />
                  <div>
                    <p className="text-slate-200 font-medium">
                      {blueprint.status === 'pending' ? 'Queued for Analysis' : 'Analyzing...'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      AI is detecting fixtures in your blueprint
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Fixture Breakdown */}
      {blueprint.status === 'completed' && blueprint.analysis_data && (
        <Card>
          <CardHeader>
            <CardTitle>Fixture Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="flex items-center justify-center py-8">
                <ArrowPathIcon className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
            ) : summary?.rooms && summary.rooms.length > 0 ? (
              <div className="space-y-6">
                {/* Fixture Totals */}
                {blueprint.analysis_data.fixtureTotals && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-3">Totals by Fixture Type</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {Object.entries(blueprint.analysis_data.fixtureTotals).map(([type, count]) => (
                        <div key={type} className="p-3 bg-slate-800 rounded-lg text-center">
                          <p className="text-lg font-bold text-slate-100">{count}</p>
                          <p className="text-xs text-slate-400 capitalize">{type}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rooms Table */}
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3">By Room</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Room</TableHead>
                        <TableHead>Floor</TableHead>
                        <TableHead>Fixtures</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.rooms.map((room, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{room.name}</TableCell>
                          <TableCell>{room.floor || '-'}</TableCell>
                          <TableCell>{room.fixtures.length}</TableCell>
                          <TableCell className="text-slate-400">
                            {room.fixtures.map(f => `${f.quantity}x ${f.type}`).join(', ')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8">No fixture data available</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {blueprint.analysis_data?.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">
              {blueprint.analysis_data.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
