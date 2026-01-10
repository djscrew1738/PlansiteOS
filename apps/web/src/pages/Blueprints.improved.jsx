import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Upload, FileText, Search, Filter, Sparkles, PlusCircle } from 'lucide-react';
import BlueprintUpload from '../components/blueprints/BlueprintUpload.improved';
import { api } from '../api/client';
import { formatDistanceToNow } from 'date-fns';

export default function Blueprints() {
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: blueprints, isLoading, refetch } = useQuery({
    queryKey: ['blueprints'],
    queryFn: () => api.get('/api/blueprints'),
  });

  const filteredBlueprints = blueprints?.data?.filter(bp =>
    bp.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bp.project_address?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-10 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                Blueprints
              </h1>
              <p className="text-gray-500 mt-1">Manage and analyze all your plumbing blueprints.</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="btn-primary btn-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Upload New Blueprint
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search blueprints by project name or address..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input pl-12 pr-4 py-2 w-full border-gray-300 focus:border-primary-500 focus:ring-primary-500 rounded-lg shadow-sm"
          />
        </div>
        <button className="btn-outline flex-shrink-0 w-full sm:w-auto">
          <Filter className="w-4 h-4 mr-2" />
          Filter Options
        </button>
      </div>

      {/* Blueprints Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
              </div>
              <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-full bg-gray-200 rounded mb-3"></div>
              <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredBlueprints.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-24 h-24 bg-blue-50 text-blue-400 rounded-full mx-auto mb-6 flex items-center justify-center">
            <FileText className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            {searchTerm ? 'No matching blueprints found.' : 'No blueprints uploaded yet.'}
          </h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            {searchTerm
              ? "Your search didn't return any blueprints. Try adjusting your keywords or clearing the filter."
              : "Start by uploading your first blueprint to unlock AI-powered analysis and streamline your project planning."
            }
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowUpload(true)}
              className="btn-primary btn-lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload First Blueprint
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBlueprints.map((blueprint, index) => (
            <BlueprintCard key={blueprint.id} blueprint={blueprint} index={index} />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <BlueprintUpload
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function BlueprintCard({ blueprint, index }) {
  const getStatusBadge = status => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'processing':
        return 'bg-amber-100 text-amber-800 animate-pulse';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Link
      to={`/blueprints/${blueprint.id}`}
      className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary-200 transition-all duration-300 group relative flex flex-col justify-between animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
          <FileText className="w-7 h-7 text-blue-600" />
        </div>
        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(blueprint.status)}`}>
          {blueprint.status}
        </span>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary-700 transition-colors line-clamp-1">
          {blueprint.project_name}
        </h3>
        {blueprint.project_address && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
            {blueprint.project_address}
          </p>
        )}
      </div>

      <div className="border-t border-gray-100 pt-4 mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-400" />
            Fixtures Detected
          </span>
          <span className="font-semibold text-gray-900">
            {blueprint.total_fixtures || 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 flex items-center gap-2">
            <Upload className="w-4 h-4 text-gray-400" />
            Uploaded
          </span>
          <span className="font-medium text-gray-700">
            {formatDistanceToNow(new Date(blueprint.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </Link>
  );
}
