import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileCheck, Search, Filter, Plus, DollarSign, Clock, CheckCircle,
  XCircle, Send, Eye, Copy, Trash2, MoreVertical, FileText, X,
  TrendingUp, Users, AlertCircle, ChevronDown
} from 'lucide-react';
import { api } from '../api/client';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Bids() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [showActionsMenu, setShowActionsMenu] = useState(null);

  const queryClient = useQueryClient();

  // Fetch bids
  const { data: bidsData, isLoading } = useQuery({
    queryKey: ['bids', searchTerm, statusFilter],
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
    queryKey: ['bids-stats'],
    queryFn: () => api.get('/api/v1/bids/statistics'),
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ bidId, status }) => api.patch(`/api/v1/bids/${bidId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['bids']);
      queryClient.invalidateQueries(['bids-stats']);
      toast.success('Bid status updated');
    },
  });

  // Clone bid mutation
  const cloneBidMutation = useMutation({
    mutationFn: (bidId) => api.post(`/api/v1/bids/${bidId}/clone`),
    onSuccess: () => {
      queryClient.invalidateQueries(['bids']);
      toast.success('Bid cloned successfully');
    },
  });

  // Delete bid mutation
  const deleteBidMutation = useMutation({
    mutationFn: (bidId) => api.delete(`/api/v1/bids/${bidId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['bids']);
      queryClient.invalidateQueries(['bids-stats']);
      toast.success('Bid deleted');
    },
  });

  const bids = bidsData?.data || [];
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
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-900 to-green-600 bg-clip-text text-transparent">
              Bids
            </h1>
            <DollarSign className="w-6 h-6 text-green-500 animate-pulse" />
          </div>
          <p className="text-gray-600 mt-2">
            Generate and manage project bids from blueprint analysis
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="btn-primary bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Generate Bid
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Bids"
          value={stats.counts?.total || 0}
          icon={FileCheck}
          color="blue"
        />
        <StatCard
          title="Pending"
          value={stats.counts?.sent || 0}
          icon={Clock}
          color="yellow"
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
          color="purple"
          isValue
        />
      </div>

      {/* Search and Filter */}
      <div className="card bg-gradient-to-br from-white to-green-50/30">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by bid number, project, or customer..."
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

      {/* Bids List */}
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
      ) : bids.length === 0 ? (
        <div className="card text-center py-16 bg-gradient-to-br from-white to-green-50/30">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl mx-auto mb-6 flex items-center justify-center">
            <FileCheck className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm || statusFilter ? 'No bids found' : 'No bids yet'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchTerm || statusFilter
              ? 'Try adjusting your search or filter criteria'
              : 'Generate your first bid from a completed blueprint analysis'
            }
          </p>
          {!searchTerm && !statusFilter && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="btn-primary bg-gradient-to-r from-green-600 to-green-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Generate Your First Bid
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid, index) => (
            <BidCard
              key={bid.id}
              bid={bid}
              index={index}
              onStatusChange={(status) => updateStatusMutation.mutate({ bidId: bid.id, status })}
              onClone={() => cloneBidMutation.mutate(bid.id)}
              onDelete={() => {
                if (confirm('Are you sure you want to delete this bid?')) {
                  deleteBidMutation.mutate(bid.id);
                }
              }}
              showActionsMenu={showActionsMenu}
              setShowActionsMenu={setShowActionsMenu}
              formatCurrency={formatCurrency}
            />
          ))}
        </div>
      )}

      {/* Generate Bid Modal */}
      {showGenerateModal && (
        <GenerateBidModal
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => {
            setShowGenerateModal(false);
            queryClient.invalidateQueries(['bids']);
            queryClient.invalidateQueries(['bids-stats']);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, isValue }) {
  const colorClasses = {
    blue: 'from-blue-100 to-blue-200 text-blue-600',
    yellow: 'from-yellow-100 to-yellow-200 text-yellow-600',
    green: 'from-green-100 to-green-200 text-green-600',
    purple: 'from-purple-100 to-purple-200 text-purple-600',
  };

  return (
    <div className="card bg-gradient-to-br from-white to-gray-50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${isValue ? 'text-green-600' : 'text-gray-900'}`}>
            {value}
          </p>
        </div>
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function BidCard({ bid, index, onStatusChange, onClone, onDelete, showActionsMenu, setShowActionsMenu, formatCurrency }) {
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

  const StatusIcon = getStatusIcon(bid.status);

  return (
    <div
      className="card hover:shadow-lg transition-all duration-300 animate-slide-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
            <DollarSign className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <Link
                to={`/bids/${bid.id}`}
                className="text-lg font-semibold text-gray-900 hover:text-green-600 transition-colors"
              >
                {bid.bidNumber}
              </Link>
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusBadge(bid.status)}`}>
                <StatusIcon className="w-3 h-3" />
                <span>{bid.status.replace('_', ' ')}</span>
              </span>
            </div>
            <p className="text-gray-600">{bid.projectName}</p>
            {bid.customerName && (
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <Users className="w-3 h-3 mr-1" />
                {bid.customerName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(bid.grandTotal)}
            </p>
            <p className="text-sm text-gray-500">
              {bid.validUntil && `Valid until ${format(new Date(bid.validUntil), 'MMM d, yyyy')}`}
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(showActionsMenu === bid.id ? null : bid.id)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>

            {showActionsMenu === bid.id && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-10">
                <Link
                  to={`/bids/${bid.id}`}
                  className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Link>
                {bid.status === 'draft' && (
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
                {bid.status === 'approved' && (
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
                  Clone Bid
                </button>
                {bid.status === 'draft' && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GenerateBidModal({ onClose, onSuccess }) {
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

      toast.success(`Bid ${response.data.bidNumber} generated successfully!`);
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to generate bid');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Generate New Bid</h2>
            <p className="text-sm text-gray-600 mt-1">Create a bid from blueprint analysis</p>
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
                      ? 'border-green-500 bg-green-50'
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
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
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
            className="btn-primary bg-gradient-to-r from-green-600 to-green-500 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4 mr-2" />
                Generate Bid
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
