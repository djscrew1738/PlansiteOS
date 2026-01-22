import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Calculator, Search, Filter, Plus, DollarSign, Clock, CheckCircle,
  XCircle, Send, Eye, Copy, Trash2, MoreVertical, FileText, X,
  TrendingUp, Users, AlertCircle, ChevronDown
} from 'lucide-react';
import { api } from '../api/client';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Estimates() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [showActionsMenu, setShowActionsMenu] = useState(null);

  const queryClient = useQueryClient();

  // Fetch estimates (using bids endpoint)
  const { data: estimatesData, isLoading } = useQuery({
    queryKey: ['estimates', searchTerm, statusFilter],
    queryFn: () => api.get('/api/v1/bids', {
      params: {
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        limit: 50
      }
    }),
  });

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: ['estimates-stats'],
    queryFn: () => api.get('/api/v1/bids/statistics'),
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ estimateId, status }) => api.patch(`/api/v1/bids/${estimateId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['estimates']);
      queryClient.invalidateQueries(['estimates-stats']);
      toast.success('Estimate status updated');
    },
  });

  // Clone estimate mutation
  const cloneEstimateMutation = useMutation({
    mutationFn: (estimateId) => api.post(`/api/v1/bids/${estimateId}/clone`),
    onSuccess: () => {
      queryClient.invalidateQueries(['estimates']);
      toast.success('Estimate cloned successfully');
    },
  });

  // Delete estimate mutation
  const deleteEstimateMutation = useMutation({
    mutationFn: (estimateId) => api.delete(`/api/v1/bids/${estimateId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['estimates']);
      queryClient.invalidateQueries(['estimates-stats']);
      toast.success('Estimate deleted');
    },
  });

  const estimates = estimatesData?.data || [];
  const stats = statsData?.data || { counts: {}, values: {} };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow-lg shadow-emerald-500/30">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
                Estimates
              </h1>
              <p className="text-sm text-gray-600">
                Generate and manage project estimates from blueprint analysis
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="btn-primary bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-emerald-500/30"
        >
          <Plus className="w-4 h-4 mr-2" />
          Generate Estimate
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Estimates"
          value={stats.counts?.total || 0}
          icon={Calculator}
          color="emerald"
        />
        <StatCard
          title="Pending"
          value={stats.counts?.sent || 0}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Accepted"
          value={stats.counts?.accepted || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Total Value"
          value={formatCurrency(stats.values?.totalAccepted)}
          icon={TrendingUp}
          color="indigo"
          isValue
        />
      </div>

      {/* Search and Filter */}
      <div className="card bg-gradient-to-br from-white to-emerald-50/30">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by estimate number, project, or customer..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input pl-12 bg-white/80 backdrop-blur-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input w-full md:w-48"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Estimates List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="skeleton h-12 w-12 rounded-xl"></div>
                  <div>
                    <div className="skeleton h-5 w-32 mb-2"></div>
                    <div className="skeleton h-4 w-48"></div>
                  </div>
                </div>
                <div className="skeleton h-8 w-24 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : estimates.length === 0 ? (
        <div className="card text-center py-16 bg-gradient-to-br from-white to-emerald-50/30">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 rounded-3xl mx-auto mb-6 flex items-center justify-center">
            <Calculator className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm || statusFilter ? 'No estimates found' : 'No estimates yet'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchTerm || statusFilter
              ? 'Try adjusting your search or filter criteria'
              : 'Generate your first estimate from a completed blueprint analysis'
            }
          </p>
          {!searchTerm && !statusFilter && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="btn-primary bg-gradient-to-r from-emerald-500 to-green-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Generate Your First Estimate
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {estimates.map((estimate, index) => (
            <EstimateCard
              key={estimate.id}
              estimate={estimate}
              index={index}
              onStatusChange={(status) => updateStatusMutation.mutate({ estimateId: estimate.id, status })}
              onClone={() => cloneEstimateMutation.mutate(estimate.id)}
              onDelete={() => {
                if (confirm('Are you sure you want to delete this estimate?')) {
                  deleteEstimateMutation.mutate(estimate.id);
                }
              }}
              showActionsMenu={showActionsMenu}
              setShowActionsMenu={setShowActionsMenu}
              formatCurrency={formatCurrency}
            />
          ))}
        </div>
      )}

      {/* Generate Estimate Modal */}
      {showGenerateModal && (
        <GenerateEstimateModal
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => {
            setShowGenerateModal(false);
            queryClient.invalidateQueries(['estimates']);
            queryClient.invalidateQueries(['estimates-stats']);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, isValue }) {
  const colorClasses = {
    emerald: 'from-emerald-100 to-emerald-200 text-emerald-600',
    amber: 'from-amber-100 to-amber-200 text-amber-600',
    green: 'from-green-100 to-green-200 text-green-600',
    indigo: 'from-indigo-100 to-indigo-200 text-indigo-600',
  };

  return (
    <div className="card bg-gradient-to-br from-white to-gray-50">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={`text-xl sm:text-2xl font-bold truncate ${isValue ? 'text-emerald-600' : 'text-gray-900'}`}>
            {value}
          </p>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center flex-shrink-0 ml-3`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
}

function EstimateCard({ estimate, index, onStatusChange, onClone, onDelete, showActionsMenu, setShowActionsMenu, formatCurrency }) {
  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-700',
      pending_review: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700',
      sent: 'bg-purple-100 text-purple-700',
      viewed: 'bg-indigo-100 text-indigo-700',
      accepted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      expired: 'bg-orange-100 text-orange-700',
      archived: 'bg-gray-100 text-gray-500',
    };
    return badges[status] || badges.draft;
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: FileText,
      pending_review: Clock,
      approved: CheckCircle,
      sent: Send,
      viewed: Eye,
      accepted: CheckCircle,
      rejected: XCircle,
      expired: AlertCircle,
    };
    return icons[status] || FileText;
  };

  const StatusIcon = getStatusIcon(estimate.status);

  return (
    <div
      className="card hover:shadow-lg transition-all duration-300 animate-slide-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-100 to-green-200 rounded-xl flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <Link
                to={`/estimates/${estimate.id}`}
                className="text-lg font-semibold text-gray-900 hover:text-emerald-600 transition-colors"
              >
                {estimate.bidNumber}
              </Link>
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusBadge(estimate.status)}`}>
                <StatusIcon className="w-3 h-3" />
                <span>{estimate.status.replace('_', ' ')}</span>
              </span>
            </div>
            <p className="text-gray-600 truncate">{estimate.projectName}</p>
            {estimate.customerName && (
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <Users className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{estimate.customerName}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end space-x-4 sm:space-x-6">
          <div className="text-left sm:text-right">
            <p className="text-xl sm:text-2xl font-bold text-emerald-600">
              {formatCurrency(estimate.grandTotal)}
            </p>
            <p className="text-sm text-gray-500">
              {estimate.validUntil && `Valid until ${format(new Date(estimate.validUntil), 'MMM d, yyyy')}`}
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(showActionsMenu === estimate.id ? null : estimate.id)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>

            {showActionsMenu === estimate.id && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowActionsMenu(null)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-20">
                  <Link
                    to={`/estimates/${estimate.id}`}
                    className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Link>
                  {estimate.status === 'draft' && (
                    <button
                      onClick={() => {
                        onStatusChange('pending_review');
                        setShowActionsMenu(null);
                      }}
                      className="flex items-center w-full px-4 py-2 hover:bg-gray-50 text-gray-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Submit for Review
                    </button>
                  )}
                  {estimate.status === 'approved' && (
                    <button
                      onClick={() => {
                        onStatusChange('sent');
                        setShowActionsMenu(null);
                      }}
                      className="flex items-center w-full px-4 py-2 hover:bg-gray-50 text-gray-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send to Customer
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onClone();
                      setShowActionsMenu(null);
                    }}
                    className="flex items-center w-full px-4 py-2 hover:bg-gray-50 text-gray-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Clone Estimate
                  </button>
                  {estimate.status === 'draft' && (
                    <button
                      onClick={() => {
                        onDelete();
                        setShowActionsMenu(null);
                      }}
                      className="flex items-center w-full px-4 py-2 hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GenerateEstimateModal({ onClose, onSuccess }) {
  const [selectedBlueprint, setSelectedBlueprint] = useState('');
  const [pricingTier, setPricingTier] = useState('standard');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [markupPercent, setMarkupPercent] = useState(15);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch completed blueprints
  const { data: blueprintsData, isLoading: loadingBlueprints } = useQuery({
    queryKey: ['blueprints-completed'],
    queryFn: () => api.get('/api/blueprints'),
  });

  const completedBlueprints = (blueprintsData?.data || []).filter(
    bp => bp.status === 'completed'
  );

  const handleGenerate = async () => {
    if (!selectedBlueprint) {
      toast.error('Please select a blueprint');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await api.post('/api/v1/bids/generate', {
        blueprintId: parseInt(selectedBlueprint),
        pricingTier,
        customerName: customerName || undefined,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        markupPercent: parseFloat(markupPercent),
      });

      toast.success(`Estimate ${response.data.bidNumber} generated successfully!`);
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to generate estimate');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Generate New Estimate</h2>
            <p className="text-sm text-gray-600 mt-1">Create an estimate from blueprint analysis</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Blueprint Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Blueprint *
            </label>
            {loadingBlueprints ? (
              <div className="skeleton h-10 w-full rounded-lg"></div>
            ) : completedBlueprints.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  No completed blueprints available. Please upload and analyze a blueprint first.
                </p>
              </div>
            ) : (
              <select
                value={selectedBlueprint}
                onChange={e => setSelectedBlueprint(e.target.value)}
                className="input"
              >
                <option value="">Choose a blueprint...</option>
                {completedBlueprints.map(bp => (
                  <option key={bp.id} value={bp.id}>
                    {bp.project_name} ({bp.total_fixtures} fixtures)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Pricing Tier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pricing Tier
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'economy', label: 'Economy', desc: 'Budget-friendly' },
                { value: 'standard', label: 'Standard', desc: 'Recommended' },
                { value: 'premium', label: 'Premium', desc: 'Top quality' },
              ].map(tier => (
                <button
                  key={tier.value}
                  onClick={() => setPricingTier(tier.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    pricingTier === tier.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">{tier.label}</p>
                  <p className="text-xs text-gray-500">{tier.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Customer Information (Optional)</h3>
            <input
              type="text"
              placeholder="Customer Name"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="input"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="email"
                placeholder="Email"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                className="input"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Markup */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Markup Percentage: {markupPercent}%
            </label>
            <input
              type="range"
              min="0"
              max="50"
              value={markupPercent}
              onChange={e => setMarkupPercent(e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!selectedBlueprint || isGenerating}
            className="btn-primary bg-gradient-to-r from-emerald-500 to-green-500 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Generate Estimate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
