import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, TrendingUp, CheckCircle, XCircle, Clock, Filter, Search } from 'lucide-react';
import { api } from '../api/client';
import LeadCard from '../components/leads/LeadCard';
import toast from 'react-hot-toast';

export default function Leads() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch leads
  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads', statusFilter, priorityFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      params.append('limit', '100');

      return api.get(`/api/v1/leads?${params.toString()}`);
    }
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['lead-statistics'],
    queryFn: () => api.get('/api/v1/leads/statistics')
  });

  // Update lead status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ leadId, status }) =>
      api.patch(`/api/v1/leads/${leadId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      queryClient.invalidateQueries(['lead-statistics']);
      toast.success('Lead status updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update lead: ${error.message}`);
    }
  });

  const handleStatusChange = (leadId, newStatus) => {
    updateStatusMutation.mutate({ leadId, status: newStatus });
  };

  const handleViewDetails = (lead) => {
    // TODO: Open modal or navigate to detail page
    console.log('View lead details:', lead);
    toast.info('Lead details view coming soon');
  };

  // Filter leads by search term
  const filteredLeads = leadsData?.leads?.filter(lead => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      lead.postText?.toLowerCase().includes(search) ||
      lead.city?.toLowerCase().includes(search) ||
      lead.county?.toLowerCase().includes(search) ||
      lead.jobType?.toLowerCase().includes(search)
    );
  }) || [];

  const statistics = stats?.statistics || {
    total: 0,
    byStatus: { new: 0, contacted: 0, quoted: 0, won: 0, lost: 0 },
    avgScore: 0,
    highConfidence: 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads Management</h1>
          <p className="text-gray-600 mt-1">Track and manage customer inquiries</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Leads"
          value={statistics.total}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="New"
          value={statistics.byStatus.new}
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="In Progress"
          value={statistics.byStatus.contacted + statistics.byStatus.quoted}
          icon={TrendingUp}
          color="yellow"
        />
        <StatCard
          title="Won"
          value={statistics.byStatus.won}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="High Confidence"
          value={statistics.highConfidence}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="quoted">Quoted</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="card p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="card text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search filters' : 'No leads have been created yet'}
            </p>
          </div>
        ) : (
          filteredLeads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onStatusChange={handleStatusChange}
              onViewDetails={handleViewDetails}
            />
          ))
        )}
      </div>

      {/* Load More (if needed) */}
      {filteredLeads.length > 0 && filteredLeads.length % 100 === 0 && (
        <div className="text-center">
          <button className="btn-outline">
            Load More Leads
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
