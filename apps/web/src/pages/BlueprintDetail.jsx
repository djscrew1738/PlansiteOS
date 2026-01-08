import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, MapPin, Calendar, Download } from 'lucide-react';
import { api } from '../api/client';
import { formatDistanceToNow, format } from 'date-fns';

export default function BlueprintDetail() {
  const { id } = useParams();

  const { data: blueprint, isLoading } = useQuery({
    queryKey: ['blueprint', id],
    queryFn: () => api.get(`/api/blueprints/${id}`),
  });

  const { data: summary } = useQuery({
    queryKey: ['blueprint-summary', id],
    queryFn: () => api.get(`/api/blueprints/${id}/summary`),
    enabled: !!blueprint,
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Loading blueprint...</p>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="card text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Blueprint not found</h3>
        <Link to="/blueprints" className="btn-primary mt-4">
          Back to Blueprints
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/blueprints"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blueprints
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{blueprint.project_name}</h1>
            {blueprint.project_address && (
              <p className="text-gray-600 mt-1 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {blueprint.project_address}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 text-sm rounded-full ${
              blueprint.status === 'completed'
                ? 'bg-green-100 text-green-700'
                : blueprint.status === 'processing'
                ? 'bg-yellow-100 text-yellow-700'
                : blueprint.status === 'failed'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {blueprint.status}
            </span>
            <button className="btn-secondary flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Blueprint Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Blueprint Image</h2>
            {blueprint.file_path ? (
              <img
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${blueprint.file_path.replace(/^\./, '')}`}
                alt={blueprint.project_name}
                className="w-full rounded-lg border"
              />
            ) : (
              <div className="bg-gray-100 rounded-lg p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Image not available</p>
              </div>
            )}
          </div>

          {/* Fixture Summary */}
          {summary && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Fixture Summary</h2>
              <div className="space-y-3">
                {summary.fixturesByType?.map(fixture => (
                  <div key={fixture.type} className="flex justify-between py-2 border-b last:border-0">
                    <span className="text-gray-700 capitalize">{fixture.type.replace('_', ' ')}</span>
                    <span className="font-medium text-gray-900">{fixture.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Total Fixtures</p>
                <p className="text-lg font-semibold text-gray-900">{blueprint.total_fixtures || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">File Size</p>
                <p className="text-lg font-semibold text-gray-900">
                  {(blueprint.file_size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">File Type</p>
                <p className="text-lg font-semibold text-gray-900">
                  {blueprint.file_type?.split('/')[1]?.toUpperCase() || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Uploaded
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(blueprint.created_at), 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(blueprint.created_at), { addSuffix: true })}
                </p>
              </div>
              {blueprint.analysis_completed_at && (
                <div>
                  <p className="text-sm text-gray-600">Analysis Completed</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(blueprint.analysis_completed_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-2">
              <button className="w-full btn-primary">
                Generate Bid
              </button>
              <button className="w-full btn-secondary">
                Generate Report
              </button>
              <button className="w-full btn-secondary text-red-600">
                Delete Blueprint
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
