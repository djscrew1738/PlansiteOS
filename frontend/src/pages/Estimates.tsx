import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Download,
  Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select, SelectOption } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { useEstimatesStore } from '../stores/useEstimatesStore';
import {
  formatCurrency,
  formatCurrencyDetailed,
  formatDate,
  formatPercent,
  getEstimateStatusColor,
  getEstimateStatusLabel,
} from '../lib/utils';
import type { Estimate, EstimateStatus } from '../types';

export function Estimates() {
  const { estimates } = useEstimatesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filter and sort estimates
  const filteredEstimates = useMemo(() => {
    let filtered = estimates;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (est) =>
          est.estimateNumber.toLowerCase().includes(query) ||
          est.jobName.toLowerCase().includes(query)
      );
    }

    // Status filter (tab)
    if (activeTab !== 'all') {
      filtered = filtered.filter((est) => est.status === activeTab);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'updatedAt') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === 'createdAt') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'amount') {
        return b.totalAmount - a.totalAmount;
      }
      if (sortBy === 'profitMargin') {
        return b.profitMargin - a.profitMargin;
      }
      return 0;
    });

    return filtered;
  }, [estimates, searchQuery, activeTab, sortBy]);

  // Calculate counts for tabs
  const statusCounts = useMemo(() => {
    return {
      all: estimates.length,
      draft: estimates.filter((e) => e.status === 'draft').length,
      pending: estimates.filter((e) => e.status === 'pending').length,
      sent: estimates.filter((e) => e.status === 'sent').length,
      approved: estimates.filter((e) => e.status === 'approved').length,
      rejected: estimates.filter((e) => e.status === 'rejected').length,
    };
  }, [estimates]);

  const tabs = [
    { id: 'all', label: 'All', badge: statusCounts.all },
    { id: 'draft', label: 'Draft', badge: statusCounts.draft },
    { id: 'pending', label: 'Pending', badge: statusCounts.pending },
    { id: 'sent', label: 'Sent', badge: statusCounts.sent },
    { id: 'approved', label: 'Approved', badge: statusCounts.approved },
    { id: 'rejected', label: 'Rejected', badge: statusCounts.rejected },
  ];

  const sortOptions: SelectOption[] = [
    { label: 'Recently Updated', value: 'updatedAt' },
    { label: 'Recently Created', value: 'createdAt' },
    { label: 'Highest Amount', value: 'amount' },
    { label: 'Highest Profit Margin', value: 'profitMargin' },
  ];

  const getStatusIcon = (status: EstimateStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'sent':
        return <Send className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estimates</h1>
          <p className="text-gray-600 mt-1">
            Manage estimates, bids, and proposals
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-5 h-5" />
          New Estimate
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Search estimates or jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            >
              <Search className="w-5 h-5 text-gray-400" />
            </Input>
            <Select
              options={sortOptions}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Estimates Grid */}
      {filteredEstimates.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredEstimates.map((estimate) => (
            <Card
              key={estimate.id}
              className="hover:shadow-ctl-lg transition-shadow"
            >
              <CardContent>
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/estimates/${estimate.id}`}
                        className="text-lg font-bold text-gray-900 hover:text-orange-600 transition-colors"
                      >
                        {estimate.estimateNumber}
                      </Link>
                      <p className="text-sm text-gray-600">
                        {estimate.jobName}
                      </p>
                    </div>
                    <Badge
                      size="sm"
                      className={getEstimateStatusColor(estimate.status)}
                    >
                      <span className="flex items-center gap-1">
                        {getStatusIcon(estimate.status)}
                        {getEstimateStatusLabel(estimate.status)}
                      </span>
                    </Badge>
                  </div>

                  {/* Amount */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatCurrency(estimate.totalAmount)}
                    </span>
                    <span className="text-sm text-gray-500">total</span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 py-3 border-y border-gray-200">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(estimate.materialsCost)}
                      </div>
                      <div className="text-xs text-gray-500">Materials</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {estimate.laborHours}h
                      </div>
                      <div className="text-xs text-gray-500">Labor</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-success-600">
                        {formatPercent(estimate.profitMargin)}
                      </div>
                      <div className="text-xs text-gray-500">Margin</div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Updated {formatDate(estimate.updatedAt)}</span>
                    </div>
                    <span>Rev. {estimate.revisionNumber}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="ghost" size="sm" className="flex-1">
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1">
                      <Download className="w-4 h-4" />
                      PDF
                    </Button>
                    {estimate.status === 'draft' && (
                      <Button variant="outline" size="sm" className="flex-1">
                        <Send className="w-4 h-4" />
                        Send
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title={searchQuery ? 'No estimates found' : 'No estimates yet'}
          description={
            searchQuery
              ? 'Try adjusting your search'
              : 'Create your first estimate to start bidding on jobs'
          }
          action={
            !searchQuery
              ? {
                  label: 'Create Estimate',
                  onClick: () => setIsCreateModalOpen(true),
                  icon: <Plus className="w-5 h-5" />,
                }
              : undefined
          }
        />
      )}

      {/* Create Estimate Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Estimate"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Select Job"
            options={[
              { label: 'Select a job...', value: '' },
              { label: 'Riverside Apartments', value: 'job_1' },
              { label: 'Oak Street Condos', value: 'job_2' },
              { label: 'Trinity Tower Remodel', value: 'job_3' },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Labor Hours" type="number" placeholder="480" />
            <Input
              label="Materials Cost"
              type="number"
              placeholder="45000"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Markup %" type="number" placeholder="25" />
            <Input label="Total Amount" type="number" placeholder="125000" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setIsCreateModalOpen(false)}>
              Create Estimate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
