import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Upload, FileText, Search, Filter, Sparkles } from 'lucide-react';
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
    bp.project_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent">
              Blueprints
            </h1>
            <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
          </div>
          <p className="text-gray-600 mt-2">
            Upload and analyze plumbing blueprints with AI-powered vision
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="btn-primary"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Blueprint
        </button>
      </div>

      {/* Search and Filter */}
      <div className="card bg-gradient-to-br from-white to-blue-50/30">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search blueprints by project name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input pl-12 bg-white/80 backdrop-blur-sm"
            />
          </div>
          <button className="btn-secondary">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
        </div>
      </div>

      {/* Blueprints Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="skeleton h-12 w-12 rounded-xl"></div>
                <div className="skeleton h-6 w-20 rounded-full"></div>
              </div>
              <div className="skeleton h-6 w-3/4 mb-2 rounded"></div>
              <div className="skeleton h-4 w-full mb-3 rounded"></div>
              <div className="border-t pt-3 mt-3 space-y-2">
                <div className="skeleton h-4 w-full rounded"></div>
                <div className="skeleton h-4 w-2/3 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredBlueprints.length === 0 ? (
        <div className="card text-center py-16 bg-gradient-to-br from-white to-blue-50/30">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl mx-auto mb-6 flex items-center justify-center animate-pulse">
            <FileText className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No blueprints found' : 'No blueprints yet'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchTerm
              ? `No blueprints match "${searchTerm}". Try a different search term.`
              : 'Upload your first blueprint to get started with AI-powered analysis and automated fixture detection'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowUpload(true)}
              className="btn-primary"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Your First Blueprint
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        return 'badge-success';
      case 'processing':
        return 'badge-warning';
      case 'failed':
        return 'badge-error';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <Link
      to={`/blueprints/${blueprint.id}`}
      className="card-interactive group animate-slide-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
          <FileText className="w-7 h-7 text-blue-600" />
        </div>
        <span className={`${getStatusBadge(blueprint.status)}`}>
          {blueprint.status}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
        {blueprint.project_name}
      </h3>

      {blueprint.project_address && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{blueprint.project_address}</p>
      )}

      <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 flex items-center">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
            Fixtures Detected
          </span>
          <span className="font-semibold text-gray-900 bg-blue-50 px-2 py-0.5 rounded-md">
            {blueprint.total_fixtures || 0}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 flex items-center">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
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
